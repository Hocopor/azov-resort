const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID!
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY!
const YOOKASSA_API = 'https://api.yookassa.ru/v3'

function getAuthHeader() {
  const credentials = Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString('base64')
  return `Basic ${credentials}`
}

export interface CreatePaymentParams {
  amount: number          // in kopecks
  description: string
  bookingId: string
  returnUrl: string
  email?: string
  phone?: string
}

export interface YookassaPayment {
  id: string
  status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled'
  amount: { value: string; currency: string }
  confirmation: { type: string; confirmation_url: string }
  metadata: { booking_id: string }
}

export async function createPayment(params: CreatePaymentParams): Promise<YookassaPayment> {
  const idempotenceKey = `${params.bookingId}-${Date.now()}`

  const body = {
    amount: {
      value: (params.amount / 100).toFixed(2),
      currency: 'RUB',
    },
    confirmation: {
      type: 'redirect',
      return_url: params.returnUrl,
    },
    capture: true,
    description: params.description,
    metadata: {
      booking_id: params.bookingId,
    },
    ...(params.email || params.phone
      ? {
          receipt: {
            customer: {
              ...(params.email ? { email: params.email } : {}),
              ...(params.phone ? { phone: params.phone } : {}),
            },
            items: [
              {
                description: params.description,
                quantity: '1.00',
                amount: {
                  value: (params.amount / 100).toFixed(2),
                  currency: 'RUB',
                },
                vat_code: 1,
                payment_mode: 'full_payment',
                payment_subject: 'service',
              },
            ],
          },
        }
      : {}),
  }

  const response = await fetch(`${YOOKASSA_API}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
      'Idempotence-Key': idempotenceKey,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`YooKassa error: ${error}`)
  }

  return response.json()
}

export async function getPayment(paymentId: string): Promise<YookassaPayment> {
  const response = await fetch(`${YOOKASSA_API}/payments/${paymentId}`, {
    headers: { Authorization: getAuthHeader() },
  })

  if (!response.ok) {
    throw new Error(`Failed to get payment: ${paymentId}`)
  }

  return response.json()
}

export async function createRefund(params: {
  paymentId: string
  amount: number
  bookingId: string
}): Promise<{ id: string; status: string }> {
  const idempotenceKey = `refund-${params.bookingId}-${Date.now()}`

  const body = {
    payment_id: params.paymentId,
    amount: {
      value: (params.amount / 100).toFixed(2),
      currency: 'RUB',
    },
    description: `Возврат по брони #${params.bookingId}`,
  }

  const response = await fetch(`${YOOKASSA_API}/refunds`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
      'Idempotence-Key': idempotenceKey,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Refund error: ${error}`)
  }

  return response.json()
}

export function calculateRefundAmount(params: {
  depositAmount: number
  checkIn: Date
  cancellationPolicyDays: number
  cancellationPartialDays: number
}): { amount: number; policy: string } {
  const now = new Date()
  const daysToCheckIn = Math.ceil((params.checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysToCheckIn >= params.cancellationPolicyDays) {
    return { amount: params.depositAmount, policy: 'full' }
  } else if (daysToCheckIn >= params.cancellationPartialDays) {
    return { amount: Math.floor(params.depositAmount * 0.5), policy: 'partial' }
  } else {
    return { amount: 0, policy: 'none' }
  }
}

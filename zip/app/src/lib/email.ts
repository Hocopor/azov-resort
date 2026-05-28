import nodemailer from 'nodemailer'
import { getSettings } from '@/lib/settings'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

async function sendEmail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
  })
}

function baseTemplate(content: string, siteName: string) {
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${siteName}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Nunito',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#1a6b8a,#0d4b63);padding:32px;text-align:center;">
        <h1 style="color:white;margin:0;font-size:24px;font-weight:700;">${siteName}</h1>
        <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Отдых у Азовского моря</p>
      </div>
      <div style="padding:32px;">
        ${content}
      </div>
      <div style="background:#f9f9f9;padding:20px 32px;text-align:center;color:#888;font-size:12px;">
        <p>© ${new Date().getFullYear()} ${siteName}. Все права защищены.</p>
        <p>${process.env.NEXT_PUBLIC_SITE_URL}</p>
      </div>
    </div>
  </div>
</body>
</html>`
}

export async function sendWelcomeEmail(email: string, name: string) {
  const settings = await getSettings(['site_name', 'site_phone'])
  const siteName = settings.site_name || 'Отдых на Азове'
  const content = `
    <h2 style="color:#1a6b8a;margin-bottom:16px;">Добро пожаловать, ${name}! 🌊</h2>
    <p style="color:#444;line-height:1.6;">Спасибо за регистрацию на нашем сайте. Теперь вы можете бронировать номера онлайн, отслеживать статус броней и управлять аккаунтом.</p>
    <div style="margin:24px 0;padding:20px;background:#f0f9ff;border-radius:12px;border-left:4px solid #1a6b8a;">
      <p style="margin:0;color:#1a6b8a;font-weight:600;">Есть вопросы?</p>
      <p style="margin:8px 0 0;color:#555;">Звоните: ${settings.site_phone || '+7 (XXX) XXX-XX-XX'}</p>
    </div>
    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/rooms" style="display:inline-block;background:#e8735a;color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;margin-top:8px;">
      Выбрать номер →
    </a>`
  
  await sendEmail(email, `Добро пожаловать в ${siteName}!`, baseTemplate(content, siteName))
}

export async function sendBookingConfirmation(booking: {
  id: string
  bookingNumber: string
  guestName: string
  guestEmail: string
  roomName: string
  checkIn: Date
  checkOut: Date
  nights: number
  guests: number
  depositAmount: number
  totalPrice: number
  paymentUrl?: string
}) {
  const settings = await getSettings(['site_name', 'site_phone', 'check_in_time', 'check_out_time'])
  const siteName = settings.site_name || 'Отдых на Азове'
  
  const formatDate = (d: Date) => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  const formatMoney = (kopecks: number) => `${(kopecks / 100).toLocaleString('ru-RU')} ₽`

  const content = `
    <h2 style="color:#1a6b8a;margin-bottom:8px;">Бронь принята! 🎉</h2>
    <p style="color:#666;margin-bottom:24px;">Номер брони: <strong>#${booking.bookingNumber.slice(-8).toUpperCase()}</strong></p>
    
    <div style="background:#f9f9f9;border-radius:16px;padding:24px;margin-bottom:24px;">
      <h3 style="color:#333;margin:0 0 16px;font-size:18px;">Детали бронирования</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#888;font-size:14px;">Номер:</td><td style="padding:8px 0;font-weight:600;">${booking.roomName}</td></tr>
        <tr><td style="padding:8px 0;color:#888;font-size:14px;">Заезд:</td><td style="padding:8px 0;font-weight:600;">${formatDate(booking.checkIn)}, с ${settings.check_in_time || '14:00'}</td></tr>
        <tr><td style="padding:8px 0;color:#888;font-size:14px;">Выезд:</td><td style="padding:8px 0;font-weight:600;">${formatDate(booking.checkOut)}, до ${settings.check_out_time || '12:00'}</td></tr>
        <tr><td style="padding:8px 0;color:#888;font-size:14px;">Ночей:</td><td style="padding:8px 0;font-weight:600;">${booking.nights}</td></tr>
        <tr><td style="padding:8px 0;color:#888;font-size:14px;">Гостей:</td><td style="padding:8px 0;font-weight:600;">${booking.guests}</td></tr>
        <tr style="border-top:1px solid #eee;"><td style="padding:12px 0 8px;color:#888;font-size:14px;">Итого:</td><td style="padding:12px 0 8px;font-weight:700;font-size:18px;color:#1a6b8a;">${formatMoney(booking.totalPrice)}</td></tr>
        <tr><td style="padding:8px 0;color:#e8735a;font-size:14px;">К оплате сейчас (депозит):</td><td style="padding:8px 0;font-weight:700;color:#e8735a;">${formatMoney(booking.depositAmount)}</td></tr>
      </table>
    </div>

    ${booking.paymentUrl ? `
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${booking.paymentUrl}" style="display:inline-block;background:#e8735a;color:white;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;">
        Оплатить депозит ${formatMoney(booking.depositAmount)} →
      </a>
      <p style="color:#888;font-size:12px;margin-top:12px;">Ссылка действительна 24 часа</p>
    </div>` : ''}

    <p style="color:#666;font-size:14px;line-height:1.6;">После оплаты депозита бронь будет подтверждена. Мы свяжемся с вами для уточнения деталей.<br>Телефон: <strong>${settings.site_phone || '+7 (XXX) XXX-XX-XX'}</strong></p>`

  await sendEmail(
    booking.guestEmail,
    `Бронь #${booking.bookingNumber.slice(-8).toUpperCase()} — ${siteName}`,
    baseTemplate(content, siteName)
  )
}

export async function sendBookingCancellation(booking: {
  guestName: string
  guestEmail: string
  bookingNumber: string
  roomName: string
  checkIn: Date
  refundAmount: number
}) {
  const settings = await getSettings(['site_name'])
  const siteName = settings.site_name || 'Отдых на Азове'
  const formatDate = (d: Date) => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  const formatMoney = (kopecks: number) => `${(kopecks / 100).toLocaleString('ru-RU')} ₽`

  const content = `
    <h2 style="color:#333;margin-bottom:8px;">Бронь отменена</h2>
    <p style="color:#666;">Уважаемый(ая) ${booking.guestName},</p>
    <p style="color:#666;">Ваша бронь <strong>#${booking.bookingNumber.slice(-8).toUpperCase()}</strong> на номер «${booking.roomName}» (заезд ${formatDate(booking.checkIn)}) была отменена.</p>
    ${booking.refundAmount > 0
      ? `<div style="background:#f0fff4;border-radius:12px;padding:16px;border-left:4px solid #22c55e;margin:24px 0;">
           <p style="margin:0;color:#16a34a;font-weight:600;">Возврат: ${formatMoney(booking.refundAmount)}</p>
           <p style="margin:8px 0 0;color:#555;font-size:14px;">Средства будут возвращены в течение 3-5 рабочих дней.</p>
         </div>`
      : `<div style="background:#fff7ed;border-radius:12px;padding:16px;border-left:4px solid #f97316;margin:24px 0;">
           <p style="margin:0;color:#c2410c;font-weight:600;">Возврат депозита не предусмотрен</p>
           <p style="margin:8px 0 0;color:#555;font-size:14px;">Согласно условиям бронирования, отмена менее чем за 7 дней до заезда возврат не осуществляется.</p>
         </div>`
    }`

  await sendEmail(
    booking.guestEmail,
    `Отмена брони #${booking.bookingNumber.slice(-8).toUpperCase()} — ${siteName}`,
    baseTemplate(content, siteName)
  )
}

export async function sendAdminBookingNotification(booking: {
  bookingNumber: string
  guestName: string
  guestPhone: string
  guestEmail?: string
  roomName: string
  checkIn: Date
  checkOut: Date
  guests: number
  depositAmount: number
  comment?: string
}) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return

  const settings = await getSettings(['site_name'])
  const siteName = settings.site_name || 'Отдых на Азове'
  const formatDate = (d: Date) => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  const formatMoney = (kopecks: number) => `${(kopecks / 100).toLocaleString('ru-RU')} ₽`

  const content = `
    <h2 style="color:#1a6b8a;">Новая бронь! 🎉</h2>
    <p><strong>Номер:</strong> ${booking.roomName}</p>
    <p><strong>Гость:</strong> ${booking.guestName}</p>
    <p><strong>Телефон:</strong> ${booking.guestPhone}</p>
    ${booking.guestEmail ? `<p><strong>Email:</strong> ${booking.guestEmail}</p>` : ''}
    <p><strong>Заезд:</strong> ${formatDate(booking.checkIn)}</p>
    <p><strong>Выезд:</strong> ${formatDate(booking.checkOut)}</p>
    <p><strong>Гостей:</strong> ${booking.guests}</p>
    <p><strong>Депозит:</strong> ${formatMoney(booking.depositAmount)}</p>
    ${booking.comment ? `<p><strong>Комментарий:</strong> ${booking.comment}</p>` : ''}
    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/bookings" style="display:inline-block;background:#1a6b8a;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;margin-top:16px;">
      Открыть в админке →
    </a>`

  await sendEmail(
    adminEmail,
    `Новая бронь #${booking.bookingNumber.slice(-8).toUpperCase()} — ${siteName}`,
    baseTemplate(content, siteName)
  )
}

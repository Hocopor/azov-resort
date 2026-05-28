export async function sendVKMessage(message: string) {
  const token = process.env.VK_GROUP_TOKEN
  const adminId = process.env.VK_ADMIN_ID

  if (!token || !adminId) {
    console.warn('VK token or admin id is not provided. Skipping VK notification.')
    return
  }

  try {
    const params = new URLSearchParams()
    params.set('v', '5.199')
    params.set('access_token', token)
    params.set('user_id', adminId)
    params.set('message', message)
    params.set('random_id', Math.floor(Math.random() * 2147483647).toString())

    const res = await fetch('https://api.vk.com/method/messages.send', {
      method: 'POST',
      body: params,
    })

    const data = await res.json()
    if (data.error) {
      console.error('VK API Error:', data.error.error_msg)
    }
  } catch (error) {
    console.error('Failed to send VK message:', error)
  }
}

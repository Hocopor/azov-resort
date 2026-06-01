export async function sendVKNotification(message: string) {
  const adminId = process.env.VK_ADMIN_ID
  const token = process.env.VK_GROUP_TOKEN

  if (!adminId || !token) {
    console.warn('VK_ADMIN_ID or VK_GROUP_TOKEN not set in environment variables. VK notification skipped.')
    return false
  }

  try {
    const params = new URLSearchParams({
      user_id: adminId,
      random_id: Math.floor(Math.random() * 1000000000).toString(),
      message: message,
      access_token: token,
      v: '5.131',
    })

    const res = await fetch('https://api.vk.com/method/messages.send', {
      method: 'POST',
      body: params,
    })

    const data = await res.json()
    if (data.error) {
      console.error('VK API error:', data.error)
      return false
    }

    return true
  } catch (err) {
    console.error('Failed to send VK notification:', err)
    return false
  }
}

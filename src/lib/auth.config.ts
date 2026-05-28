import type { NextAuthConfig } from 'next-auth'
import type { OAuthConfig } from 'next-auth/providers'

// VK OAuth Provider
const VKProvider: OAuthConfig<any> = {
  id: 'vk',
  name: 'ВКонтакте',
  type: 'oauth',
  authorization: {
    url: 'https://oauth.vk.com/authorize',
    params: { scope: 'email', response_type: 'code', v: '5.131' },
  },
  token: {
    url: 'https://oauth.vk.com/access_token',
  },
  userinfo: {
    url: 'https://api.vk.com/method/users.get',
    params: { fields: 'photo_200', v: '5.131' },
    async request({ tokens }: any) {
      const res = await fetch(
        `https://api.vk.com/method/users.get?fields=photo_200&v=5.131&access_token=${tokens.access_token}`
      )
      const data = await res.json()
      const user = data.response[0]
      return {
        id: String(user.id),
        name: `${user.first_name} ${user.last_name}`,
        email: tokens.email,
        image: user.photo_200,
      }
    },
  },
  profile(profile: any) {
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      image: profile.image,
    }
  },
  clientId: process.env.VK_CLIENT_ID,
  clientSecret: process.env.VK_CLIENT_SECRET,
}

// Yandex OAuth Provider
const YandexProvider: OAuthConfig<any> = {
  id: 'yandex',
  name: 'Яндекс',
  type: 'oidc',
  issuer: 'https://login.yandex.ru',
  clientId: process.env.YANDEX_CLIENT_ID,
  clientSecret: process.env.YANDEX_CLIENT_SECRET,
  authorization: {
    params: { scope: 'login:email login:info login:avatar' },
  },
  profile(profile: any) {
    return {
      id: profile.id || profile.sub,
      name: profile.real_name || profile.display_name || profile.name,
      email: profile.default_email || profile.email,
      image: profile.default_avatar_id
        ? `https://avatars.yandex.net/get-yapic/${profile.default_avatar_id}/islands-200`
        : null,
    }
  },
}

export const authConfig = {
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: '/auth/login',
    newUser: '/account',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
  },
  providers: [VKProvider, YandexProvider],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      if (trigger === 'update' && session) {
        token.name = session.name
        token.email = session.email
      }
      return token
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  trustHost: true,
} satisfies NextAuthConfig

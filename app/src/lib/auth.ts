import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import type { OAuthConfig } from 'next-auth/providers'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

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
    async request({ tokens, provider }: any) {
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

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 }, // 30 days
  pages: {
    signIn: '/auth/login',
    newUser: '/account',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Пароль', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = z.object({
          email: z.string().email(),
          password: z.string().min(8),
        }).safeParse(credentials)

        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email, deletedAt: null },
        })

        if (!user || !user.passwordHash) return null
        if (!user.emailVerified) throw new Error('EMAIL_NOT_VERIFIED')

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      },
    }),
    VKProvider,
    YandexProvider,
  ],
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
      // Refresh role from DB on each request
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, name: true, deletedAt: true },
        })
        if (!dbUser || dbUser.deletedAt) {
          return {} // invalidate token for deleted accounts
        }
        token.role = dbUser.role
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
  events: {
    async createUser({ user }) {
      // Send welcome email
      try {
        const { sendWelcomeEmail } = await import('@/lib/email')
        if (user.email) await sendWelcomeEmail(user.email, user.name || 'Гость')
      } catch (e) {
        console.error('Failed to send welcome email:', e)
      }
    },
  },
  trustHost: true,
})

// Type augmentation
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authConfig } from '@/lib/auth.config'

const { providers = [], callbacks, ...restAuthConfig } = authConfig

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...restAuthConfig,
  adapter: PrismaAdapter(prisma),
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
    ...providers,
  ],
  callbacks: {
    ...callbacks,
    async jwt(args) {
      const token = (callbacks?.jwt ? await callbacks.jwt(args as any) : args.token) ?? args.token

      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, name: true, deletedAt: true },
        })

        if (!dbUser || dbUser.deletedAt) {
          return {}
        }

        token.role = dbUser.role
      }

      return token
    },
  },
  events: {
    async createUser({ user }) {
      try {
        const { sendWelcomeEmail } = await import('@/lib/email')
        if (user.email) await sendWelcomeEmail(user.email, user.name || 'Гость')
      } catch (e) {
        console.error('Failed to send welcome email:', e)
      }
    },
  },
})

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

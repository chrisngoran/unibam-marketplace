import NextAuth from 'next-auth'
import type { Session } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GitHubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const oauthProviders = [
  ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
    ? [
        GitHubProvider({
          clientId: process.env.GITHUB_ID,
          clientSecret: process.env.GITHUB_SECRET,
        }),
      ]
    : []),
  ...(process.env.GOOGLE_ID && process.env.GOOGLE_SECRET
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_ID,
          clientSecret: process.env.GOOGLE_SECRET,
        }),
      ]
    : []),
  ...(process.env.FACEBOOK_ID && process.env.FACEBOOK_SECRET
    ? [
        FacebookProvider({
          clientId: process.env.FACEBOOK_ID,
          clientSecret: process.env.FACEBOOK_SECRET,
        }),
      ]
    : []),
]

const credentialsProvider = CredentialsProvider({
  id: 'credentials',
  name: 'Demo login',
  credentials: {
    email: { label: 'Email', type: 'email', placeholder: 'demo@bamenda.edu' },
    password: { label: 'Password', type: 'password' },
  },
  async authorize(credentials) {
    const email = String(credentials?.email || '').trim().toLowerCase()
    if (!email) {
      return null
    }

    const user = await prisma.user.upsert({
      where: { email },
      create: { email, name: 'Demo User' },
      update: {},
    })

    return {
      id: user.id,
      name: user.name || 'Demo User',
      email: user.email,
    }
  },
})

const providers = oauthProviders.length > 0 ? oauthProviders : [credentialsProvider]

export const authOptions = {
  adapter: PrismaAdapter(prisma as any),
  providers,
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async session({ session, user }: { session: Session; user: any }) {
      if (session.user) {
        ;(session.user as any).id = user.id
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)

import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    // 1. Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'demo_google_client_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'demo_google_client_secret',
    }),

    // 2. Email / Credentials Provider (For custom login form)
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'user@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Demo Authentication Logic (Can be connected to Prisma / MongoDB / PostgreSQL)
        // Accepts demo account or any valid email input for testing ease
        return {
          id: 'user_1',
          name: credentials.email.split('@')[0] || 'Demo User',
          email: credentials.email,
          image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${credentials.email}`,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'chatbot_ai_super_secret_jwt_key_2026_antigravity',
};

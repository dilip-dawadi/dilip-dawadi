import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/db';
import { users, sessions, accounts, verificationTokens } from '@/db/schema';
import { sendLoginNotification } from './gmail';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'select_account', // Force account selection every time
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Send login notification email
      if (user.email) {
        try {
          await sendLoginNotification({
            email: user.email,
            name: user.name || undefined,
            loginTime: new Date(),
          });
        } catch (error) {
          console.error('Failed to send login notification:', error);
          // Don't block login if email fails
        }
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role || 'user';
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const role = auth?.user?.role;
      if (pathname.startsWith('/admin')) {
        return role === 'admin';
      }
      return true;
    },
  },
  session: {
    strategy: 'database',
  },
  trustHost: true,
});

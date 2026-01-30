import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notifyUnauthorizedAccess } from '@/lib/gmail';

export async function checkAdminAccess() {
  const session = await auth();

  if (!session || !session.user) {
    return { isAdmin: false, user: null, session: null };
  }

  // Check if user has admin role
  const userData = await db.select().from(users).where(eq(users.id, session.user.id!)).limit(1);

  const isAdmin = userData[0]?.role === 'admin';

  return {
    isAdmin,
    user: userData[0],
    session,
  };
}

export async function requireAdmin() {
  const { isAdmin, user: userData } = await checkAdminAccess();

  if (!isAdmin) {
    // Send notification about unauthorized access attempt
    try {
      await notifyUnauthorizedAccess({
        path: '/admin',
        attemptedAction: 'Access admin area',
      });
    } catch (error) {
      console.error('Failed to send unauthorized access notification:', error);
    }

    throw new Error('Unauthorized: Admin access required');
  }

  return userData;
}

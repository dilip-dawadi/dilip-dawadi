import { auth } from '@/lib/auth';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

export async function checkAdminAccess() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { isAdmin: false, user: null, session: null };
  }

  // Check if user has admin role
  const userData = await db
    .select()
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

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
    throw new Error('Unauthorized: Admin access required');
  }

  return userData;
}

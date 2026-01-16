import { checkAdminAccess } from '@/lib/admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { isAdmin, user } = await checkAdminAccess();

    return NextResponse.json({
      isAdmin,
      user: user ? { id: user.id, email: user.email, name: user.name, role: user.role } : null,
    });
  } catch (error) {
    return NextResponse.json({ isAdmin: false, user: null }, { status: 200 });
  }
}

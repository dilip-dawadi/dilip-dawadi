import { checkAdminAccess } from '@/lib/admin';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin } = await checkAdminAccess();
  console.log('Is Admin:', isAdmin);
  if (!isAdmin) {
    redirect('/admin');
  }

  return <>{children}</>;
}

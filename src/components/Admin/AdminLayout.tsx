'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Toaster } from 'sonner';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  backLink?: string;
}

export default function AdminLayout({
  children,
  title,
  backLink = '/admin/dashboard',
}: AdminLayoutProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/admin');
      return;
    }

    if (status === 'authenticated') {
      // Check if user is admin
      if (session?.user?.role === 'admin') {
        setIsAdmin(true);
        setLoading(false);
      } else {
        router.replace('/admin');
      }
    }
  }, [status, session, router]);

  const handleSignOut = async () => {
    const { signOut } = await import('next-auth/react');
    signOut({ callbackUrl: '/admin' });
  };

  if (status === 'loading' || loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="text-lg" style={{ color: 'var(--color-fg)' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!session || !session.user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Toaster position="bottom-center" richColors />
      <nav
        className="shadow-sm"
        style={{
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-alt)',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={backLink}
                className="text-sm transition-colors"
                style={{ color: 'var(--color-fg-light)' }}
              >
                ← Back
              </Link>
              <div className="text-xl font-bold" style={{ color: 'var(--color-fg-bold)' }}>
                {title}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="h-8 w-8 rounded-full ring-2"
                  style={{ borderColor: 'var(--color-border)' }}
                />
              )}
              <span className="text-sm" style={{ color: 'var(--color-fg)' }}>
                {session.user.name}
              </span>
              <button
                onClick={handleSignOut}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                style={{ backgroundColor: 'rgb(220, 38, 38)' }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgb(185, 28, 28)')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgb(220, 38, 38)')}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}

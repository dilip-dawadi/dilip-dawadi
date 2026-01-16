'use client';

import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const checkSession = async () => {
      try {
        const { data } = await authClient.getSession();
        if (!isMounted) return;

        if (!data) {
          router.replace('/admin');
          return;
        }

        // Check admin status
        const res = await fetch('/api/auth/check-admin', {
          signal: abortController.signal,
        });

        if (!isMounted) return;
        const adminData = await res.json();

        if (!adminData.isAdmin) {
          router.replace('/admin');
          return;
        }

        if (isMounted) {
          setIsAdmin(true);
          setSession(data);
          setLoading(false);
        }
      } catch (error: any) {
        if (error.name === 'AbortError' || !isMounted) return;
        router.replace('/admin');
      }
    };

    checkSession();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [router]);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push('/admin');
  };

  if (loading) {
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

  if (!session || !isAdmin) {
    return null;
  }

  const dashboardCards = [
    {
      title: 'About',
      description: 'Manage about section content',
      href: '/admin/dashboard/about',
      icon: '📝',
      color: 'bg-blue-500',
    },
    {
      title: 'Projects',
      description: 'Manage your projects and portfolio',
      href: '/admin/dashboard/projects',
      icon: '💼',
      color: 'bg-green-500',
    },
    {
      title: 'Writing',
      description: 'Manage blog posts and articles',
      href: '/admin/dashboard/writing',
      icon: '✍️',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <nav
        className="shadow-sm"
        style={{
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-alt)',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <div className="text-xl font-bold" style={{ color: 'var(--color-fg-bold)' }}>
                Dashboard
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name}
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <span className="text-sm" style={{ color: 'var(--color-fg)' }}>
                  {session.user.name}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="rounded-md px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
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

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-fg-bold)' }}>
            Welcome back!
          </h2>
          <p className="mt-2" style={{ color: 'var(--color-fg-light)' }}>
            Manage your content from the dashboard below.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {dashboardCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group relative overflow-hidden rounded-lg p-6 shadow-sm transition-all hover:shadow-lg"
              style={{
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-alt)',
              }}
            >
              <div
                className={`absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full ${card.color} opacity-10 transition-transform group-hover:scale-150`}
              />
              <div className="relative">
                <div className="mb-3 text-4xl">{card.icon}</div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-fg-bold)' }}>
                  {card.title}
                </h3>
                <p className="mt-2 text-sm" style={{ color: 'var(--color-fg-light)' }}>
                  {card.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

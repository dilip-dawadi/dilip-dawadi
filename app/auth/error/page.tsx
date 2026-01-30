'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');

  useEffect(() => {
    // Track failed login attempts
    if (error) {
      fetch('/api/auth/track-failure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error }),
      }).catch((err) => console.error('Failed to track auth error:', err));
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {error === 'OAuthAccountNotLinked'
              ? 'This email is already associated with another account.'
              : error === 'OAuthCallback'
                ? 'There was an error during the OAuth callback.'
                : error === 'AccessDenied'
                  ? 'Access was denied. You may not have permission to sign in.'
                  : 'An error occurred during authentication.'}
          </p>
        </div>
        <div className="mt-8 space-y-4">
          <Link
            href="/"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Return Home
          </Link>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Error code: {error || 'Unknown'}
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PageWrapper from '@/components/Template/PageWrapper';

function AuthErrorContent() {
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

  const errorMessages = {
    OAuthAccountNotLinked: 'This email is already associated with another account.',
    OAuthCallback: 'There was an error during the OAuth callback.',
    AccessDenied: 'Access was denied. You may not have permission to sign in.',
    default: 'An error occurred during authentication.',
  };

  const errorMessage = error
    ? errorMessages[error as keyof typeof errorMessages] || errorMessages.default
    : errorMessages.default;

  return (
    <section className="auth-error-page">
      <header className="auth-error-header">
        <h1 className="page-title">Authentication Error</h1>
        <p className="page-subtitle">{errorMessage}</p>
      </header>

      <div className="auth-error-content">
        <div className="auth-error-actions">
          <Link href="/" className="button button--primary">
            Return Home
          </Link>
          {error && (
            <p className="auth-error-code">
              Error code: <code>{error}</code>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default function AuthErrorPage() {
  return (
    <PageWrapper>
      <Suspense
        fallback={
          <section className="auth-error-page">
            <header className="auth-error-header">
              <h1 className="page-title">Loading...</h1>
            </header>
          </section>
        }
      >
        <AuthErrorContent />
      </Suspense>
    </PageWrapper>
  );
}

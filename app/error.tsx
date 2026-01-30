'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console
    console.error('Application error:', error);

    // Send notification to admin about the error
    const notifyAdmin = async () => {
      try {
        const response = await fetch('/api/error-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: error.message,
            digest: error.digest,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
          }),
        });

        if (!response.ok) {
          console.error('Failed to send error notification');
        }
      } catch (notifyError) {
        console.error('Error sending notification:', notifyError);
      }
    };

    notifyAdmin();
  }, [error]);

  return (
    <main className="error-page">
      <div className="error-content">
        <span className="error-code">500</span>
        <h1 className="error-title">Something Went Wrong</h1>
        <p className="error-message">
          An unexpected error occurred while processing your request. The issue has been logged and
          will be investigated.
        </p>
        {error.digest && (
          <p className="error-digest">
            Error ID: <code>{error.digest}</code>
          </p>
        )}
        <div className="error-actions">
          <button onClick={reset} className="error-button" type="button">
            Try Again
          </button>
          <Link href="/" className="error-link">
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}

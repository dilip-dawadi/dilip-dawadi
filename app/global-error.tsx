'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log critical error to console
    console.error('Critical application error:', error);

    // Send notification to admin about the critical error
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
            critical: true,
          }),
        });

        if (!response.ok) {
          console.error('Failed to send critical error notification');
        }
      } catch (notifyError) {
        console.error('Error sending notification:', notifyError);
      }
    };

    notifyAdmin();
  }, [error]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Critical Error</title>
        <style>{`
          :root {
            --color-bg: #ffffff;
            --color-fg: #333333;
            --color-fg-bold: #1a1a1a;
            --color-fg-light: #666666;
            --color-accent: #2e59ba;
            --color-accent-light: #e8f1ff;
            --color-border: #e5e5e5;
            --radius-md: 8px;
            --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          
          @media (prefers-color-scheme: dark) {
            :root {
              --color-bg: #0a0a0a;
              --color-fg: #cccccc;
              --color-fg-bold: #ffffff;
              --color-fg-light: #999999;
              --color-accent: #60a5fa;
              --color-accent-light: rgba(96, 165, 250, 0.1);
              --color-border: #333333;
            }
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: var(--color-bg);
            color: var(--color-fg);
            line-height: 1.6;
          }
          
          .error-page {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 2rem;
          }
          
          .error-content {
            text-align: center;
            max-width: 600px;
          }
          
          .error-code {
            display: block;
            font-size: clamp(4rem, 15vw, 8rem);
            font-weight: 900;
            line-height: 1;
            background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-fg) 100%);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            opacity: 0.9;
            margin-bottom: 1rem;
          }
          
          .error-title {
            font-size: 2rem;
            font-weight: 700;
            color: var(--color-fg-bold);
            margin-bottom: 1rem;
          }
          
          .error-message {
            font-size: 1.125rem;
            color: var(--color-fg-light);
            margin-bottom: 2rem;
            line-height: 1.7;
          }
          
          .error-digest {
            font-size: 0.875rem;
            color: var(--color-fg-light);
            margin-bottom: 2rem;
          }
          
          .error-digest code {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            background: var(--color-accent-light);
            border-radius: 4px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 0.8125rem;
            border: 1px solid var(--color-border);
          }
          
          .error-actions {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            flex-wrap: wrap;
          }
          
          .error-button, .error-link {
            display: inline-flex;
            align-items: center;
            padding: 0.875rem 2rem;
            font-size: 1rem;
            font-weight: 600;
            text-decoration: none;
            border-radius: var(--radius-md);
            transition: all 0.2s ease;
            cursor: pointer;
            border: none;
            font-family: inherit;
          }
          
          .error-button {
            background: var(--color-accent);
            color: white;
            box-shadow: var(--shadow-md);
          }
          
          .error-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
          }
          
          .error-link {
            background: transparent;
            color: var(--color-fg);
            border: 2px solid var(--color-border);
          }
          
          .error-link:hover {
            color: var(--color-accent);
            border-color: var(--color-accent);
            background: var(--color-accent-light);
            transform: translateY(-2px);
          }
        `}</style>
      </head>
      <body>
        <main className="error-page">
          <div className="error-content">
            <span className="error-code">500</span>
            <h1 className="error-title">Critical Error</h1>
            <p className="error-message">
              A critical error occurred. The issue has been logged and will be investigated
              immediately.
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
              <a href="/" className="error-link">
                Go Home
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}

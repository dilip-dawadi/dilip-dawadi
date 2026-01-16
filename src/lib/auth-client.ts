import { createAuthClient } from 'better-auth/react';

// Polyfill to prevent better-auth from accessing process.env on client
if (typeof window !== 'undefined' && typeof process === 'undefined') {
  (globalThis as any).process = {
    env: {
      NODE_ENV: 'production',
    },
  };
}

// Client-side auth configuration
// Uses window.location.origin to automatically adapt to any domain
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  basePath: '/api/auth',
  fetchOptions: {
    onError(context) {
      console.error('Auth error:', context.error);
    },
    // Ensure credentials are included for cookie-based auth
    credentials: 'include',
  },
});

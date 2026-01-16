import { createAuthClient } from 'better-auth/react';

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

import { createAuthClient } from 'better-auth/react';

console.log('[Auth Client] Creating auth client...');
console.log('[Auth Client] process.env exists:', typeof process !== 'undefined');
console.log('[Auth Client] window.location.origin:', typeof window !== 'undefined' ? window.location.origin : 'N/A');

// Client-side auth configuration
// Uses window.location.origin to automatically adapt to any domain
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  basePath: '/api/auth',
  fetchOptions: {
    onError(context) {
      console.error('[Auth Client] Fetch error:', context.error);
    },
    onRequest(request) {
      console.log('[Auth Client] Request:', request.url);
    },
    onSuccess(response) {
      console.log('[Auth Client] Success:', response);
    },
    // Ensure credentials are included for cookie-based auth
    credentials: 'include',
  },
});

console.log('[Auth Client] Auth client created successfully');

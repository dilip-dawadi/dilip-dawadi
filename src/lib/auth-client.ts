// Comprehensive polyfill for better-auth client-side initialization
if (typeof window !== 'undefined') {
  console.log('[Auth Client] Initializing browser polyfills...');

  // Create a more complete process.env polyfill
  if (typeof process === 'undefined') {
    console.log('[Auth Client] Creating process.env polyfill');
    (globalThis as any).process = {
      env: {
        NODE_ENV: 'production',
        BETTER_AUTH_SECRET: undefined,
        AUTH_SECRET: undefined,
        BETTER_AUTH_TELEMETRY: undefined,
        BETTER_AUTH_TELEMETRY_ID: undefined,
        BETTER_AUTH_URL: undefined,
      },
    };
  }

  // Ensure global variables that better-auth might reference don't throw
  if (typeof (globalThis as any).Deno === 'undefined') {
    (globalThis as any).Deno = undefined;
  }
  if (typeof (globalThis as any).Bun === 'undefined') {
    (globalThis as any).Bun = undefined;
  }

  console.log('[Auth Client] Polyfills created successfully');
}

import { createAuthClient } from 'better-auth/react';

console.log('[Auth Client] Starting createAuthClient...');

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

// Better Auth client-side polyfill
// This must run BEFORE any Better Auth code is loaded
(function() {
  if (typeof window !== 'undefined') {
    console.log('[Auth Polyfill] Initializing global polyfills...');
    
    // Create process.env polyfill if it doesn't exist
    if (typeof process === 'undefined') {
      console.log('[Auth Polyfill] Creating process global');
      window.process = {
        env: {
          NODE_ENV: 'production',
          BETTER_AUTH_SECRET: undefined,
          AUTH_SECRET: undefined,
          BETTER_AUTH_TELEMETRY: undefined,
          BETTER_AUTH_TELEMETRY_ID: undefined,
          BETTER_AUTH_URL: undefined,
          PACKAGE_VERSION: '0.0.0',
          BETTER_AUTH_TELEMETRY_ENDPOINT: 'https://telemetry.better-auth.com/v1/track',
        }
      };
      
      // Also set on globalThis for better compatibility
      globalThis.process = window.process;
    }
    
    // Ensure Deno and Bun don't cause errors
    if (typeof Deno === 'undefined') {
      window.Deno = undefined;
      globalThis.Deno = undefined;
    }
    if (typeof Bun === 'undefined') {
      window.Bun = undefined;
      globalThis.Bun = undefined;
    }
    
    console.log('[Auth Polyfill] Polyfills created successfully');
  }
})();

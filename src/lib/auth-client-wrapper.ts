// Wrapper to safely load better-auth client only when needed
let authClientInstance: any = null;
let authClientPromise: Promise<any> | null = null;

export async function getAuthClient() {
  if (authClientInstance) {
    return authClientInstance;
  }

  if (authClientPromise) {
    return authClientPromise;
  }

  authClientPromise = (async () => {
    try {
      const { createAuthClient } = await import('better-auth/react');

      authClientInstance = createAuthClient({
        baseURL:
          typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_APP_URL : 'http://localhost:3000',
        basePath: '/api/auth',
        fetchOptions: {
          onError(context) {
            console.error('[Auth Client] Fetch error:', context.error);
          },
          credentials: 'include',
        },
      });

      return authClientInstance;
    } catch (error) {
      console.error('[Auth Wrapper] Failed to create auth client:', error);
      throw error;
    }
  })();

  return authClientPromise;
}

// For backwards compatibility, export a proxy
export const authClient = new Proxy({} as any, {
  get(target, prop) {
    // Return async functions that wait for the client to load
    return async (...args: any[]) => {
      const client = await getAuthClient();
      const method = client[prop];
      if (typeof method === 'function') {
        return method.apply(client, args);
      }
      return method;
    };
  },
});

import type { Metadata } from 'next';
import { Raleway, Source_Sans_3 } from 'next/font/google';
import Script from 'next/script';
import Navigation from '@/components/Template/Navigation';
import ScrollToTop from '@/components/Template/ScrollToTop';
import { AUTHOR_NAME, SITE_URL, TWITTER_HANDLE } from '@/lib/utils';
import './tailwind.css';

const sourceSans = Source_Sans_3({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-source-sans',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

const raleway = Raleway({
  weight: ['400', '800'],
  subsets: ['latin'],
  variable: '--font-raleway',
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

const siteDescription =
  'Full-Stack Software Developer with 3.5+ years of experience in React, Node.js, PostgreSQL, and modern DevOps. Based in Toronto, Canada.';

export const metadata: Metadata = {
  title: {
    default: AUTHOR_NAME,
    template: `%s | ${AUTHOR_NAME}`,
  },
  description: siteDescription,
  keywords: [
    AUTHOR_NAME,
    'Full-Stack Developer',
    'React',
    'Node.js',
    'PostgreSQL',
    'Toronto',
    'Software Engineer',
    'Web Development',
  ],
  authors: [{ name: AUTHOR_NAME }],
  creator: AUTHOR_NAME,
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/images/favicon/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/images/favicon/favicon.png',
    shortcut: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: AUTHOR_NAME,
    title: AUTHOR_NAME,
    description: siteDescription,
    images: [
      {
        url: '/images/me.jpg',
        width: 1200,
        height: 630,
        alt: AUTHOR_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
    title: AUTHOR_NAME,
    description: siteDescription,
    images: ['/images/me.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sourceSans.variable} ${raleway.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Better Auth polyfill - MUST load first - inline for maximum priority */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  if (typeof window !== 'undefined') {
    const envProxy = new Proxy(
      {
        NODE_ENV: 'production',
        BETTER_AUTH_SECRET: undefined,
        AUTH_SECRET: undefined,
        BETTER_AUTH_TELEMETRY: undefined,
        BETTER_AUTH_TELEMETRY_ID: undefined,
        BETTER_AUTH_URL: undefined,
        PACKAGE_VERSION: '0.0.0',
        BETTER_AUTH_TELEMETRY_ENDPOINT: 'https://telemetry.better-auth.com/v1/track',
      },
      {
        get(target, prop) {
          return prop in target ? target[prop] : undefined;
        },
      }
    );

    if (typeof process === 'undefined') {
      window.process = { env: envProxy };
      globalThis.process = window.process;
    } else if (process.env) {
      const existingEnv = process.env;
      process.env = new Proxy(existingEnv, {
        get(target, prop) {
          if (prop in target) return target[prop];
          return undefined;
        },
      });
    }

    if (typeof Deno === 'undefined') {
      window.Deno = undefined;
      globalThis.Deno = undefined;
    }
    if (typeof Bun === 'undefined') {
      window.Bun = undefined;
      globalThis.Bun = undefined;
    }
  }
})();
`,
          }}
        />

        {/* CSP-safe theme initialization - prevents flash on load */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t)}else if(window.matchMedia('(prefers-color-scheme:dark)').matches){document.documentElement.setAttribute('data-theme','dark')}else{document.documentElement.setAttribute('data-theme','light')}}catch(e){}})();`}
        </Script>
      </head>

      <body>
        <ScrollToTop />
        <div className="site-wrapper">
          <Navigation />
          {children}
        </div>
      </body>
    </html>
  );
}

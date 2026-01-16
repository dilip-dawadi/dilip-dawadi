import { GoogleAnalytics as NextGoogleAnalytics } from '@next/third-parties/google';

export default function GoogleAnalytics() {
  // Use hardcoded value or pass it as a prop from server component
  const gaId = process.env.NEXT_PUBLIC_GA_TRACKING_ID;

  // If no GA ID is set, don't render anything
  if (!gaId) {
    return null;
  }

  return <NextGoogleAnalytics gaId={gaId} />;
}

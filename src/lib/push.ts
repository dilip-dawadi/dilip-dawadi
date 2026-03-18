import webpush from 'web-push';

export interface StoredPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

let vapidConfigured = false;

function configureVapid(): boolean {
  if (vapidConfigured) {
    return true;
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

  if (!publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export async function sendPushNotification(
  subscription: StoredPushSubscription,
  payload: PushPayload,
): Promise<{ ok: boolean; expired?: boolean }> {
  const hasVapidConfig = configureVapid();

  if (!hasVapidConfig) {
    return { ok: false };
  }

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { ok: true };
  } catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode;

    if (statusCode === 404 || statusCode === 410) {
      return { ok: false, expired: true };
    }

    console.error('Failed to send push notification:', error);
    return { ok: false };
  }
}

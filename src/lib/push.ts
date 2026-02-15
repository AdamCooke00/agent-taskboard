import webpush from "web-push";

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (publicKey && privateKey) {
    webpush.setVapidDetails("mailto:noreply@agent-taskboard.dev", publicKey, privateKey);
    vapidConfigured = true;
  }
}

// In-memory store for development; use Upstash Redis in production
const subscriptions = new Map<string, webpush.PushSubscription[]>();

export function savePushSubscription(userId: string, subscription: webpush.PushSubscription) {
  const existing = subscriptions.get(userId) || [];
  // Avoid duplicates
  const found = existing.find((s) => s.endpoint === subscription.endpoint);
  if (!found) {
    existing.push(subscription);
    subscriptions.set(userId, existing);
  }
}

export async function sendPushNotification(
  userId: string,
  notification: { title: string; body: string; url: string }
) {
  ensureVapid();
  const subs = subscriptions.get(userId);
  if (!subs || subs.length === 0) return;

  const payload = JSON.stringify(notification);

  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub, payload);
    } catch (err: any) {
      if (err.statusCode === 410) {
        // Subscription expired, remove it
        const filtered = subs.filter((s) => s.endpoint !== sub.endpoint);
        subscriptions.set(userId, filtered);
      }
    }
  }
}

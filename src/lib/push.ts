import webpush from "web-push";
import { Redis } from "@upstash/redis";

const SUBSCRIPTIONS_KEY = "push_subscriptions";

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (pub && priv) {
    webpush.setVapidDetails("mailto:noreply@agent-taskboard.dev", pub, priv);
    vapidConfigured = true;
  }
}

function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (url && token) return new Redis({ url, token });
  return null;
}

// In-memory fallback for local dev (no Redis configured)
const memoryStore: webpush.PushSubscription[] = [];

async function loadSubscriptions(): Promise<webpush.PushSubscription[]> {
  const redis = getRedis();
  if (redis) {
    const data = await redis.get<webpush.PushSubscription[]>(SUBSCRIPTIONS_KEY);
    return data ?? [];
  }
  return memoryStore;
}

async function saveSubscriptions(subs: webpush.PushSubscription[]): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(SUBSCRIPTIONS_KEY, subs);
  } else {
    memoryStore.splice(0, memoryStore.length, ...subs);
  }
}

export async function savePushSubscription(subscription: webpush.PushSubscription) {
  const existing = await loadSubscriptions();
  if (!existing.find((s) => s.endpoint === subscription.endpoint)) {
    await saveSubscriptions([...existing, subscription]);
  }
}

export async function sendPushNotification(notification: {
  title: string;
  body: string;
  url: string;
}) {
  ensureVapid();
  const subs = await loadSubscriptions();
  if (subs.length === 0) return;

  const payload = JSON.stringify(notification);
  const active: webpush.PushSubscription[] = [];

  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub, payload);
      active.push(sub);
    } catch (err: any) {
      if (err.statusCode !== 410) {
        active.push(sub); // keep unless explicitly expired
      }
    }
  }

  // Persist cleaned list (removes expired 410 subscriptions)
  if (active.length !== subs.length) {
    await saveSubscriptions(active);
  }
}

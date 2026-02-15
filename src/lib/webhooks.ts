import { verify } from "@octokit/webhooks-methods";

export async function verifyWebhookSignature(
  payload: string,
  signature: string | null
): Promise<boolean> {
  if (!signature || !process.env.GITHUB_WEBHOOK_SECRET) return false;
  return verify(process.env.GITHUB_WEBHOOK_SECRET, payload, signature);
}

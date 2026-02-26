import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { ensureRepoWebhook, removeRepoWebhook } from "@/lib/github";

export async function GET() {
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    trackedRepos: session.trackedRepos || [],
    theme: session.theme || "system",
  });
}

export async function PUT(req: NextRequest) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { trackedRepos, theme } = await req.json();

  // Capture old list before overwriting so we can diff for webhook management
  const previousRepos: string[] = session.trackedRepos || [];

  if (trackedRepos !== undefined) session.trackedRepos = trackedRepos;
  if (theme !== undefined) session.theme = theme;
  await session.save();

  // Auto-manage webhooks for added/removed repos (fire and forget, never blocks save)
  const webhookUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/github`
    : null;
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

  if (webhookUrl && webhookSecret && trackedRepos) {
    const added = (trackedRepos as string[]).filter((r) => !previousRepos.includes(r));
    const removed = previousRepos.filter((r) => !(trackedRepos as string[]).includes(r));

    for (const fullName of added) {
      const [owner, repo] = fullName.split("/");
      ensureRepoWebhook(session.githubToken, owner, repo, webhookUrl, webhookSecret)
        .catch((err) => console.warn(`[webhook] create failed for ${fullName}:`, err.message));
    }
    for (const fullName of removed) {
      const [owner, repo] = fullName.split("/");
      removeRepoWebhook(session.githubToken, owner, repo, webhookUrl)
        .catch((err) => console.warn(`[webhook] delete failed for ${fullName}:`, err.message));
    }
  }

  return NextResponse.json({ trackedRepos: session.trackedRepos, theme: session.theme });
}

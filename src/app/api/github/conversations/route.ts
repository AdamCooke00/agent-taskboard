import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { listConversations } from "@/lib/github";

export async function GET() {
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const repos = session.trackedRepos || [];
  if (repos.length === 0) {
    return NextResponse.json([]);
  }

  const conversations = await listConversations(
    session.githubToken,
    repos,
    session.githubUser.login
  );
  return NextResponse.json(conversations);
}

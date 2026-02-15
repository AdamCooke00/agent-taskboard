import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { listUserRepos } from "@/lib/github";

export async function GET() {
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const repos = await listUserRepos(session.githubToken);
  return NextResponse.json(repos);
}

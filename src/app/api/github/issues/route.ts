import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { createIssue } from "@/lib/github";

export async function POST(req: NextRequest) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { owner, repo, title, body } = await req.json();
  if (!owner || !repo || !title || !body) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const issue = await createIssue(
    session.githubToken,
    owner,
    repo,
    title,
    body
  );
  return NextResponse.json(issue);
}

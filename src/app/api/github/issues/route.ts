import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { createIssue, closeIssue } from "@/lib/github";

export async function POST(req: NextRequest) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { owner, repo, title, body, labels } = await req.json();
  if (!owner || !repo || !title || !body) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const issue = await createIssue(
    session.githubToken,
    owner,
    repo,
    title,
    body,
    labels
  );
  return NextResponse.json(issue);
}

export async function PATCH(req: NextRequest) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { owner, repo, number, state } = await req.json();
  if (!owner || !repo || !number || !state) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (state !== "closed") {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  await closeIssue(
    session.githubToken,
    owner,
    repo,
    number
  );
  return NextResponse.json({ success: true });
}

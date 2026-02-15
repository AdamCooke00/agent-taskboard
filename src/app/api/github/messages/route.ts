import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { listMessages, postComment } from "@/lib/github";

export async function GET(req: NextRequest) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const owner = req.nextUrl.searchParams.get("owner");
  const repo = req.nextUrl.searchParams.get("repo");
  const number = req.nextUrl.searchParams.get("number");

  if (!owner || !repo || !number) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const messages = await listMessages(
    session.githubToken,
    owner,
    repo,
    parseInt(number, 10),
    session.githubUser.login
  );
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { owner, repo, number, body } = await req.json();
  if (!owner || !repo || !number || !body) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const comment = await postComment(
    session.githubToken,
    owner,
    repo,
    number,
    body
  );
  return NextResponse.json(comment);
}

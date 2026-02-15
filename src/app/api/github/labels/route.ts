import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { addLabel, removeLabel, getIssueLabels } from "@/lib/github";

export async function GET(req: NextRequest) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const number = searchParams.get("number");

  if (!owner || !repo || !number) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const labels = await getIssueLabels(
    session.githubToken,
    owner,
    repo,
    parseInt(number, 10)
  );
  return NextResponse.json({ labels });
}

export async function POST(req: NextRequest) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { owner, repo, number, label } = await req.json();
  if (!owner || !repo || !number || !label) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await addLabel(session.githubToken, owner, repo, number, label);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { owner, repo, number, label } = await req.json();
  if (!owner || !repo || !number || !label) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await removeLabel(session.githubToken, owner, repo, number, label);
  return NextResponse.json({ ok: true });
}

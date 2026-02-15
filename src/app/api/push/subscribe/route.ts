import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { savePushSubscription } from "@/lib/push";

export async function POST(req: NextRequest) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await req.json();
  const userId = String(session.githubUser.id);
  savePushSubscription(userId, subscription);

  return NextResponse.json({ ok: true });
}

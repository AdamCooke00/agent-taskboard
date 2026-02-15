import { NextResponse } from "next/server";
import { getGitHubOAuthUrl } from "@/lib/auth";

export async function GET() {
  const url = getGitHubOAuthUrl();
  return NextResponse.redirect(url);
}

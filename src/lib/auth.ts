import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";
import type { SessionData } from "./types";

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET || "development-secret-must-be-at-least-32-chars",
  cookieName: "taskboard_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
}

export async function getAuthenticatedSession(): Promise<IronSession<SessionData> | null> {
  const session = await getSession();
  if (!session.githubToken) return null;
  return session;
}

export function getGitHubOAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    scope: "repo read:user notifications",
    redirect_uri: `${getBaseUrl()}/api/auth/callback`,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

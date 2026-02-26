import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { createRepoFromTemplate } from "@/lib/github";

export async function POST(req: NextRequest) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description } = await req.json();

  // Server-side validation: name must match GitHub naming rules
  if (!name || typeof name !== "string") {
    return NextResponse.json(
      { error: "Repository name is required", step: "validate" },
      { status: 400 }
    );
  }

  // GitHub repo name rules: 1-100 chars, alphanumeric/.-_ only, cannot start with .
  const namePattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/;
  if (!namePattern.test(name)) {
    return NextResponse.json(
      {
        error:
          "Invalid repository name. Must start with a letter or number and contain only letters, numbers, dots, hyphens, and underscores (max 100 characters).",
        step: "validate",
      },
      { status: 400 }
    );
  }

  try {
    const result = await createRepoFromTemplate(
      session.githubToken,
      session.githubUser.login,
      name,
      description
    );
    return NextResponse.json(result);
  } catch (err: unknown) {
    // Handle specific Octokit errors
    if (err && typeof err === "object" && "status" in err) {
      if (err.status === 422) {
        return NextResponse.json(
          {
            error: "A repository with this name already exists in your account",
            step: "create",
          },
          { status: 422 }
        );
      }
    }
    return NextResponse.json(
      {
        error: "Failed to create repository",
        step: "create",
      },
      { status: 500 }
    );
  }
}

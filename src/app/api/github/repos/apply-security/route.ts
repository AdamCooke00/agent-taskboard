import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { waitForBranch, applyRepoSecurity } from "@/lib/github";

export async function POST(req: NextRequest) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { owner, repo } = await req.json();

  if (!owner || !repo || typeof owner !== "string" || typeof repo !== "string") {
    return NextResponse.json(
      { error: "Owner and repo are required", step: "validate" },
      { status: 400 }
    );
  }

  try {
    // Wait for the main branch to be available (template generation is async)
    await waitForBranch(session.githubToken, owner, repo, "main");
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Branch main not available after waiting",
        step: "wait_for_branch",
      },
      { status: 408 }
    );
  }

  try {
    // Apply security settings (branch protection + interaction limits)
    await applyRepoSecurity(session.githubToken, owner, repo);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    // Handle specific errors
    if (err && typeof err === "object" && "status" in err) {
      if (err.status === 409) {
        return NextResponse.json(
          {
            error:
              "Conflict with organization-level settings. Some security settings may not have been applied.",
            step: "apply_security",
          },
          { status: 409 }
        );
      }
    }
    return NextResponse.json(
      {
        error: "Failed to apply security settings",
        step: "apply_security",
      },
      { status: 500 }
    );
  }
}

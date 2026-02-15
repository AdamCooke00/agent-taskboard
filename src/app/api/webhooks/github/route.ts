import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/webhooks";
import { containsQuestion } from "@/lib/github";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  const valid = await verifyWebhookSignature(body, signature);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = req.headers.get("x-github-event");
  const payload = JSON.parse(body);

  switch (event) {
    case "issue_comment":
      await handleIssueComment(payload);
      break;
    case "pull_request":
      await handlePullRequest(payload);
      break;
    case "issues":
      await handleIssueEvent(payload);
      break;
    case "workflow_run":
      await handleWorkflowRun(payload);
      break;
  }

  return NextResponse.json({ ok: true });
}

async function handleIssueComment(payload: any) {
  const { issue, comment, repository } = payload;
  const isBot = comment.user?.type === "Bot";

  if (isBot && containsQuestion(comment.body)) {
    // Agent is asking a question — would trigger push notification
    console.log(
      `[webhook] Agent question detected on ${repository.full_name}#${issue.number}: ${comment.body.slice(0, 100)}`
    );
    // TODO: Send push notification when Upstash Redis is configured
  }
}

async function handlePullRequest(payload: any) {
  const { action, pull_request, repository } = payload;

  if (action === "labeled") {
    const label = payload.label?.name;
    if (label === "needs-review" || label === "blocked") {
      console.log(
        `[webhook] PR ${repository.full_name}#${pull_request.number} labeled ${label}`
      );
      // TODO: Send push notification
    }
  }
}

async function handleIssueEvent(payload: any) {
  const { action, issue, repository } = payload;

  if (action === "closed") {
    console.log(
      `[webhook] Issue ${repository.full_name}#${issue.number} closed`
    );
    // TODO: Send push notification for task completion
  }
}

async function handleWorkflowRun(payload: any) {
  const { action, workflow_run, repository } = payload;

  if (action === "completed" && workflow_run.conclusion === "failure") {
    console.log(
      `[webhook] Workflow failed on ${repository.full_name}: ${workflow_run.name}`
    );
    // TODO: Send push notification for workflow failure
  }
}

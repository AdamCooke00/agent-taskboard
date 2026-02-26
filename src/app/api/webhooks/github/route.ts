import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/webhooks";
import { containsQuestion } from "@/lib/github";
import { sendPushNotification } from "@/lib/push";

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
  // Also catch agents posting as a user account (via PAT_TOKEN instead of GitHub App)
  const looksLikeAgent = /\bclaud[ei]\b/i.test(comment.user?.login || "");

  if ((isBot || looksLikeAgent) && containsQuestion(comment.body)) {
    const [owner, repo] = repository.full_name.split("/");
    await sendPushNotification({
      title: "Agent needs input",
      body: issue.title,
      url: `/conversations/${owner}-${repo}-issue-${issue.number}`,
    });
  }
}

async function handlePullRequest(payload: any) {
  const { action, pull_request, repository } = payload;

  if (action === "labeled") {
    const label = payload.label?.name;
    if (label === "needs-review" || label === "blocked") {
      const [owner, repo] = repository.full_name.split("/");
      await sendPushNotification({
        title: label === "blocked" ? "PR blocked" : "PR ready for review",
        body: pull_request.title,
        url: `/conversations/${owner}-${repo}-pr-${pull_request.number}`,
      });
    }
  }
}

async function handleIssueEvent(payload: any) {
  const { action, issue, repository } = payload;

  if (action === "closed") {
    const [owner, repo] = repository.full_name.split("/");
    await sendPushNotification({
      title: "Task complete",
      body: issue.title,
      url: `/conversations/${owner}-${repo}-issue-${issue.number}`,
    });
  }
}

async function handleWorkflowRun(payload: any) {
  const { action, workflow_run, repository } = payload;

  if (action === "completed" && workflow_run.conclusion === "failure") {
    await sendPushNotification({
      title: "Workflow failed",
      body: `${workflow_run.name} on ${repository.full_name}`,
      url: `/`,
    });
  }
}

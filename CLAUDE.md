# CLAUDE.md

<!-- Keep this file under 500 lines. It loads into context on every run,
so every line costs tokens. Move detailed workflow instructions into
.claude/rules/ or skills as the project grows. -->

## Project Overview

Agent Taskboard is a mobile-first PWA that serves as a command center for managing AI coding agents powered by the Automated Developer Framework. It wraps GitHub's issue/PR/comment model into a chat-like messaging experience. Core concept: conversations = GitHub issues, messages = comments, new tasks = issue creation. All data lives in GitHub — no traditional database.

**Multi-Agent Workflow**: The framework uses a three-agent system (Plan → Review → Implement) with label-based state transitions. The UI displays these states but does NOT manage labels — agents and the framework control all label transitions. Users provide guidance through comments, which agents read and incorporate.

## Tech Stack

- TypeScript + Next.js 14 (App Router)
- React 18 with SWR for data fetching
- Tailwind CSS + shadcn/ui-style components
- iron-session for auth (encrypted cookies)
- Octokit for GitHub REST API
- react-markdown + remark-gfm for markdown rendering
- web-push for push notifications
- Deployed on Vercel (serverless)

## Project Structure

- `src/app/`              Next.js App Router pages and API routes
- `src/app/api/auth/`     GitHub OAuth endpoints
- `src/app/api/github/`   GitHub API proxy routes (conversations, issues, messages, repos)
- `src/app/api/webhooks/` GitHub webhook receiver
- `src/app/api/push/`     Push notification subscription management
- `src/app/api/settings/` User settings (tracked repos)
- `src/components/`       React components (chat/, dashboard/, conversation/, layout/)
- `src/hooks/`            SWR hooks (use-session, use-conversations, use-messages, use-repos)
- `src/lib/`              Core libraries (auth, github, push, webhooks, types, utils)
- `public/`               PWA manifest, service worker, icons

## Development Commands

- `npm install`        Install dependencies
- `npm run dev`        Start dev server on localhost:3000
- `npm run build`      Production build (type-checks included)
- `npm run lint`       Run ESLint

## Code Conventions

- Use TypeScript strict mode — avoid `any` types
- Mobile-first design — test at 375px width minimum
- All GitHub API calls go through `/api/github/*` proxy routes (never expose tokens to client)
- Use SWR hooks for all client-side data fetching
- Components are client-side (`"use client"`) unless they need server data
- Use `cn()` utility from `src/lib/utils.ts` for conditional classnames
- Keep API routes thin — business logic goes in `src/lib/`

## Testing Requirements

- Run `npm run build` to verify type safety before creating PRs
- Test on mobile viewport (375px) for layout issues
- Verify GitHub API interactions work with real tokens when possible

## PR and Review Guidelines

- PRs should change fewer than 400 lines when possible
- Include a description of what changed and why
- One concern per PR — don't mix refactoring with features

## Issue Management (do not remove)

- Close issues after fully resolving the request (comment with answer, or open a PR with "Closes #N" in the description).
- If you cannot fully resolve an issue, leave it open and comment explaining what's blocked.
- After pushing code changes, always create a PR using `gh pr create` with a title, body, and "Closes #N" in the body. Do not skip this step.

## Output Style (do not remove)

- Be thorough in analysis but concise in output. Prefer bullet points over paragraphs.
- Issue comments: answer the question directly, skip preamble and summaries of what you're about to do. Do not include task checklists.
- PR descriptions: state what changed and why in 2-3 sentences, then a bullet list of files changed.
- Code review comments: one sentence per issue, include the fix. Skip praise.
- Minimize tool calls: batch file reads, avoid reading files you don't need, prefer glob over individual reads.

## PR Risk Labeling (do not remove)

When creating PRs, always assess risk and add exactly one of these labels:

- `auto-merge` — Docs, formatting, dependency bumps, trivial fixes with passing tests. Safe to merge without human review.
- `needs-review` — New features, refactors, architecture changes, security-related code. Requires human review before merge.
- `blocked` — Cannot proceed without human input or decision.

Default to `needs-review` when uncertain. Never use `auto-merge` for changes that touch authentication, authorization, payment, or data deletion logic.

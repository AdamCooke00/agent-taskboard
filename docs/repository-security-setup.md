# Repository Security Setup

Required settings for any repository using this framework. These protect against unauthorized access on public repos and ensure the multi-agent pipeline can operate (auto-merge, label transitions, etc.).

## Branch Protection (Settings > Branches > main)

| Setting | Value | Why |
|---------|-------|-----|
| Require pull request before merging | Optional | Prevents direct pushes to main; agents already create PRs |
| Required approving reviews | **0 (none)** | The multi-agent pipeline (Spec → Plan → Review → Implement → PR Label → Code Review) IS the review process. A human approval requirement blocks the `auto-merge.yml` workflow |
| Dismiss stale reviews | Off | No reviews to dismiss |
| Require code owner reviews | Off | Not needed for solo/small team |
| Allow force pushes | **Off** | Prevents history rewriting |
| Allow deletions | **Off** | Prevents branch deletion |
| Enforce admins | Off | Allows admin override when needed |

## Pull Request Access (Settings > General > Features)

| Setting | Value | Why |
|---------|-------|-----|
| `pull_request_creation_policy` | **`collaborators_only`** | Permanent restriction — only collaborators with write access can create PRs. Outsiders can view but not create. This is the primary defense against unwanted contributions |

### API command
```bash
gh api repos/OWNER/REPO -X PATCH -f pull_request_creation_policy=collaborators_only
```

## Interaction Limits (Settings > Moderation > Interaction limits)

| Setting | Value | Why |
|---------|-------|-----|
| Limit to | `collaborators_only` | Blocks non-collaborators from commenting, opening issues, creating PRs, and reacting |
| Duration | 6 months (max) | Temporary — must be renewed. Covers issues/comments that `pull_request_creation_policy` doesn't |

### API command
```bash
gh api repos/OWNER/REPO/interaction-limits -X PUT --input - <<'EOF'
{"limit": "collaborators_only", "expiry": "six_months"}
EOF
```

> **Note:** Interaction limits expire. Set a reminder to renew, or accept that after expiry outsiders can open issues and comment (but still can't create PRs if the permanent setting above is applied).

## GitHub Actions (Settings > Actions > General)

| Setting | Value | Why |
|---------|-------|-----|
| Actions permissions | All actions allowed (or restrict to specific) | Your choice — `all` is convenient but broad |
| Fork pull request workflows | Require approval for all external contributors | Prevents forks from running your workflows without approval |
| Workflow permissions | **Read** (default) | Least privilege for GITHUB_TOKEN |
| Allow GitHub Actions to approve PRs | On | Needed if actions create/approve PRs |

## Collaborators (Settings > Collaborators)

Only add trusted users. Each collaborator bypasses all the restrictions above. For the multi-agent framework, the only required collaborator is the repo owner.

## Secrets (Settings > Secrets and variables > Actions)

Required secrets for the agent pipeline:

| Secret | Purpose |
|--------|---------|
| `CLAUDE_CODE_OAUTH_TOKEN` | Primary auth for claude-code-action (Max plan) |
| `ANTHROPIC_API_KEY` | Fallback auth for claude-code-action (API plan) |
| `PAT_TOKEN` | GitHub Personal Access Token — used by agents to create PRs, add labels, post comments. Must have `repo` scope |

## Private Repositories

For private repos, the security posture is simpler:

- `pull_request_creation_policy` is less critical (only collaborators can see the repo anyway)
- Interaction limits are unnecessary (no public access)
- Branch protection (no force push, no deletion) is still recommended
- **All secrets and Actions settings still apply identically**
- Fork pull request workflows are not a concern (forks of private repos are also private and restricted)

## Quick Setup Script

Apply all settings to a new repo:

```bash
OWNER="AdamCooke00"
REPO="your-repo-name"

# Permanent: restrict PR creation to collaborators
gh api repos/$OWNER/$REPO -X PATCH -f pull_request_creation_policy=collaborators_only

# Temporary (6 months): restrict all interactions to collaborators
gh api repos/$OWNER/$REPO/interaction-limits -X PUT --input - <<'EOF'
{"limit": "collaborators_only", "expiry": "six_months"}
EOF

# Branch protection: no force push, no deletion, no approval required
gh api repos/$OWNER/$REPO/branches/main/protection -X PUT --input - <<'EOF'
{
  "required_status_checks": null,
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

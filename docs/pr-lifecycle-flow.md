# PR Lifecycle Flow

This document describes how PRs flow through the multi-agent system from creation to merge.

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ ISSUE PHASE (Issue-based planning workflow)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  New @claude Issue                                                  │
│         │                                                           │
│         │ (Framework auto-adds planning label)                      │
│         ▼                                                           │
│    [planning]  ──► Plan Agent creates plan                          │
│         │                                                           │
│         ▼                                                           │
│   [plan-review] ──► Review Agent critiques                          │
│         │                                                           │
│         ├─► [planning] (needs revision)                             │
│         ├─► [needs-human-input] (3 cycles exceeded)                 │
│         └─► [ready-to-implement] (approved)                         │
│                    │                                                │
│                    ▼                                                │
│         Implementation Agent executes                               │
│                    │                                                │
└────────────────────┼────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PR PHASE (PR-based review and merge workflow)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│         PR Created (with plan in description)                       │
│                    │                                                │
│                    ├─► If code changes: add [needs-tests]           │
│                    │                                                │
│                    ▼                                                │
│            Test Agent runs                                          │
│                    │                                                │
│         ┌──────────┴──────────┐                                     │
│         ▼                     ▼                                     │
│    Tests Pass            Tests Fail                                 │
│         │                     │                                     │
│         │                     └─► [blocked] + notify human          │
│         │                                                           │
│         ▼                                                           │
│  PR Label Agent analyzes                                            │
│         │                                                           │
│    ┌────┴────┬────────────┐                                         │
│    ▼         ▼            ▼                                         │
│[auto-merge] [needs-review] [blocked]                                │
│    │         │            │                                         │
│    ▼         ▼            └─► Human fixes required                  │
│    │    Code Review                                                 │
│    │    Agent runs                                                  │
│    │         │                                                      │
│    │    ┌────┴────┐                                                 │
│    │    ▼         ▼                                                 │
│    │  Issues   No Issues                                            │
│    │  Found                                                         │
│    │    │         │                                                 │
│    │    ▼         └─► (if auto-merge) Auto Merge workflow           │
│    │  @claude fix      (if needs-review) Wait for human             │
│    │    │                                                           │
│    │    ▼                                                           │
│    │  Implementation Agent (PR Fix Mode)                            │
│    │    │                                                           │
│    │    ├─► Reads PR description for plan context                   │
│    │    ├─► Applies fixes                                          │
│    │    ├─► Pushes to PR branch                                    │
│    │    └─► PR synchronize triggers Code Review again               │
│    │         │                                                      │
│    │         └─► Cycle repeats (max 2 times)                        │
│    │              │                                                 │
│    │              └─► If still failing: [needs-human-review]        │
│    │                                                                │
│    └─► (if auto-merge + no issues) Auto Merge workflow              │
│                    │                                                │
│                    ▼                                                │
│              PR Merged & Closed                                     │
│                    │                                                │
│                    └─► Issue automatically closed (via "Closes #N") │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Decision Points

### Test Agent Decision
- `needs-tests` label present → Run tests
- Tests pass → Remove `needs-tests`
- Tests fail → Add `blocked`, remove `auto-merge`

### PR Label Agent Classification
- Docs/formatting/trivial (<50 lines) → `auto-merge`
- Features/refactors/changes (>50 lines) → `needs-review`
- Missing plan/security concerns → `blocked`

### Code Review Agent Decision
- Reviews every PR on open/synchronize
- Validates against plan in PR description
- "## Issues Found" → Post `@claude fix`
- "## No Issues" + `auto-merge` → Triggers Auto Merge workflow
- "## No Issues" + `needs-review` → Waits for human

### Auto-Fix Cycle Limits
- Iteration 1: Auto-fix
- Iteration 2: Auto-fix
- Iteration 3+: Apply `needs-human-review`, notify author

## Context Preservation Strategy

**Plan context flows through PR description:**

1. Implementation Agent reads approved plan from issue
2. Includes plan summary in PR description when calling `gh pr create`
3. Code Review Agent reads PR description, validates implementation against plan
4. If fixes needed, Implementation Agent (PR Fix Mode) reads PR description for plan context
5. Plan remains accessible throughout all revision cycles

**No context loss at any stage.**

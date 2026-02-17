# Workflow Patterns

## Max Subscription with API Key Fallback

All agent workflows use this pattern to optimize cost:

1. Check if Max subscription token exists
2. If yes: Use `claude_code_oauth_token` (no additional cost)
3. If Max fails or unavailable: Fall back to `anthropic_api_key`
4. Check for `error_max_turns` to avoid double-charging

This pattern is repeated across:
- claude.yml (Plan, Review, Implementation agents)
- claude-review.yml (Code Review)
- pr-label-agent.yml (PR Label)
- test-agent.yml (Test)
- ci-doctor.yml
- pr-size-guardian.yml
- daily-digest.yml
- agent-health-report.yml
- doc-drift-detector.yml
- stale-issue-gardener.yml

**Future Enhancement:** Extract to composite action `.github/actions/claude-agent-run/` to reduce duplication.

## Example Pattern

```yaml
jobs:
  example_agent:
    runs-on: ubuntu-latest
    env:
      HAS_MAX_TOKEN: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN != '' && 'true' || 'false' }}
    steps:
      # Primary: Use Max subscription
      - name: Run agent with Max subscription
        id: max
        if: env.HAS_MAX_TOKEN == 'true'
        continue-on-error: true
        uses: anthropics/claude-code-action@v1
        with:
          allowed_bots: "claude"
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          prompt: |
            [Agent prompt here]
          claude_args: "--max-turns 10 --dangerously-skip-permissions"

      # Check if fallback is actually needed (avoid double-charging on max-turns)
      - name: Check if fallback needed
        id: check_fallback
        if: steps.max.outcome != 'success'
        run: |
          OUTPUT="/home/runner/work/_temp/claude-execution-output.json"
          if [ -f "$OUTPUT" ] && grep -q "error_max_turns" "$OUTPUT" 2>/dev/null; then
            echo "Max hit turn limit after doing work — skipping fallback"
            echo "needed=false" >> $GITHUB_OUTPUT
          else
            echo "needed=true" >> $GITHUB_OUTPUT
          fi

      # Fallback: Use API key
      - name: Run agent with API key (Fallback)
        if: steps.max.outcome != 'success' && steps.check_fallback.outputs.needed != 'false'
        uses: anthropics/claude-code-action@v1
        with:
          allowed_bots: "claude"
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            [Same agent prompt]
          claude_args: "--max-turns 10 --dangerously-skip-permissions"
```

## Why This Pattern?

1. **Cost Optimization**: Max subscription provides unlimited usage for a flat fee
2. **Fallback Safety**: If Max token is missing/expired, automatically fall back to API key
3. **No Double-Charging**: Checks for `error_max_turns` to avoid running fallback when Max already did work
4. **Minimal Changes**: Both steps use identical prompts, making maintenance easy

## When to Use Each Token

**Use Max Subscription (`CLAUDE_CODE_OAUTH_TOKEN`):**
- Development environments with frequent agent runs
- Workflows that run multiple times per day
- Long-running agents (high turn counts)

**Use API Key (`ANTHROPIC_API_KEY`):**
- Production environments without Max subscription
- Infrequent agent runs
- Pay-per-token billing model

## Future Refactoring

To reduce code duplication, extract this pattern into a composite action:

```yaml
# .github/actions/claude-agent-run/action.yml
name: 'Run Claude Agent with Max/Fallback'
description: 'Runs Claude agent with Max subscription, falls back to API key'
inputs:
  prompt:
    description: 'Prompt for the agent'
    required: true
  max_turns:
    description: 'Maximum turns for the agent'
    default: '10'
  allowed_tools:
    description: 'Allowed tools for the agent'
    required: false
runs:
  using: 'composite'
  steps:
    # Implementation here
```

This would allow workflows to use:

```yaml
- uses: ./.github/actions/claude-agent-run
  with:
    prompt: "Do something"
    max_turns: 10
```

**Status:** Not yet implemented - documented for future enhancement.

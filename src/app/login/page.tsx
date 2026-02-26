"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <svg
              className="h-8 w-8 text-primary-foreground"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            Agent Taskboard
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to manage your AI coding agents
          </p>
        </div>

        {error === "unauthorized" ? (
          <div className="rounded-lg border bg-muted p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">This is a personal deployment.</p>
            <p className="mt-1">
              To use Agent Taskboard, deploy your own instance.{" "}
              <a
                href="https://github.com/AdamCooke00/agent-taskboard"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                See setup instructions →
              </a>
            </p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            Authentication failed: {error}
          </div>
        ) : null}

        <a
          href="/api/auth/github"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#24292f] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#24292f]/90 dark:bg-white dark:text-[#24292f] dark:hover:bg-white/90"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Sign in with GitHub
        </a>

        <p className="text-xs text-muted-foreground">
          Requires access to your repositories to manage agent tasks.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import { useConversations } from "@/hooks/use-conversations";
import { useSession } from "@/hooks/use-session";
import { ConversationItem } from "@/components/conversation/conversation-item";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MessageSquare, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ConversationsPage() {
  const { conversations, isLoading, mutate } = useConversations();
  const { trackedRepos } = useSession();
  const [activeRepo, setActiveRepo] = useState<string | null>(null);

  const filtered = activeRepo
    ? conversations.filter((c) => c.repo.fullName === activeRepo)
    : conversations;

  // Get unique repos from conversations
  const repoNames = Array.from(new Set(conversations.map((c) => c.repo.fullName)));

  if (trackedRepos.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur">
          <h1 className="text-lg font-semibold">Conversations</h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <MessageSquare className="mb-3 h-12 w-12 text-muted-foreground/50" />
          <p className="font-medium">No repos tracked yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Go to Settings to select which repos to monitor.
          </p>
        </div>
        <div className="h-20" />
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Conversations</h1>
          <button
            onClick={() => mutate()}
            className="p-1.5 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Repo filter chips */}
        {repoNames.length > 1 && (
          <div className="scrollbar-hide mt-3 flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveRepo(null)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                !activeRepo
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              All
            </button>
            {repoNames.map((name) => (
              <button
                key={name}
                onClick={() => setActiveRepo(name)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  activeRepo === name
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                {name.split("/")[1]}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Conversation list */}
      <div className="flex-1 space-y-2 p-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl border bg-muted"
              />
            ))}
          </>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No active conversations
            </p>
          </div>
        ) : (
          filtered.map((conv) => (
            <ConversationItem key={conv.id} conversation={conv} />
          ))
        )}
      </div>

      {/* Bottom spacing for nav */}
      <div className="h-20" />
      <MobileNav />
    </div>
  );
}

"use client";

import { useState } from "react";
import { ConversationItem } from "@/components/conversation/conversation-item";
import { CompletedFilterBar } from "./completed-filter-bar";
import type { Conversation } from "@/lib/types";

interface CompletedFilters {
  type: "all" | "issue" | "pull_request";
  repo: string; // "all" or "owner/repo"
  timeRange: "24h" | "7d" | "30d" | "all";
}

interface CompletedViewProps {
  conversations: Conversation[];
  trackedRepos: string[];
}

interface DateGroup {
  label: string;
  conversations: Conversation[];
}

export function CompletedView({
  conversations,
  trackedRepos,
}: CompletedViewProps) {
  const [filters, setFilters] = useState<CompletedFilters>({
    type: "all",
    repo: "all",
    timeRange: "7d",
  });

  const handleFilterChange = (
    filterKey: keyof CompletedFilters,
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [filterKey]: value }));
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    // Only show non-open items
    if (c.state === "open") return false;

    // Type filter
    if (filters.type !== "all" && c.type !== filters.type) return false;

    // Repo filter
    if (filters.repo !== "all" && c.repo.fullName !== filters.repo)
      return false;

    // Time range filter
    if (filters.timeRange !== "all") {
      const now = new Date();
      const updatedAt = new Date(c.updatedAt);
      const diffHours = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);

      if (filters.timeRange === "24h" && diffHours > 24) return false;
      if (filters.timeRange === "7d" && diffHours > 24 * 7) return false;
      if (filters.timeRange === "30d" && diffHours > 24 * 30) return false;
    }

    return true;
  });

  // Sort by most recent first
  filteredConversations.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  // Group by date
  const dateGroups: DateGroup[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groupMap = new Map<string, Conversation[]>();

  for (const conversation of filteredConversations) {
    const updatedAt = new Date(conversation.updatedAt);
    const dateOnly = new Date(
      updatedAt.getFullYear(),
      updatedAt.getMonth(),
      updatedAt.getDate()
    );

    let groupLabel: string;
    if (dateOnly.getTime() === today.getTime()) {
      groupLabel = "Today";
    } else if (dateOnly.getTime() === yesterday.getTime()) {
      groupLabel = "Yesterday";
    } else if (dateOnly >= weekAgo) {
      groupLabel = "This Week";
    } else {
      groupLabel = "Earlier";
    }

    if (!groupMap.has(groupLabel)) {
      groupMap.set(groupLabel, []);
    }
    groupMap.get(groupLabel)!.push(conversation);
  }

  // Convert to array in desired order
  const groupOrder = ["Today", "Yesterday", "This Week", "Earlier"];
  for (const label of groupOrder) {
    if (groupMap.has(label)) {
      dateGroups.push({ label, conversations: groupMap.get(label)! });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Completed Activity</h2>
        <CompletedFilterBar
          filters={filters}
          trackedRepos={trackedRepos}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Result count */}
      <div className="text-sm text-muted-foreground">
        {filteredConversations.length}{" "}
        {filteredConversations.length === 1 ? "item" : "items"}
      </div>

      {/* Date-grouped list */}
      {dateGroups.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No completed items match filters
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {dateGroups.map((group) => (
            <div key={group.label}>
              <h3 className="text-xs font-medium text-muted-foreground uppercase mb-3">
                {group.label}
              </h3>
              <div className="space-y-3">
                {group.conversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

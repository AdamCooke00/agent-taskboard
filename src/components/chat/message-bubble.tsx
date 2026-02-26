"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Message } from "@/lib/types";

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
}

const AGENT_BADGE_CONFIG: Record<string, { label: string; color: string }> = {
  spec: { label: "Spec Check", color: "amber" },
  plan: { label: "Implementation Plan", color: "blue" },
  review: { label: "Review", color: "orange" },
  implement: { label: "Implement", color: "green" },
  "ci-doctor": { label: "CI Diagnosis", color: "red" },
  "daily-digest": { label: "Report", color: "gray" },
  "health-report": { label: "Report", color: "gray" },
  gardener: { label: "Report", color: "gray" },
  "doc-drift": { label: "Report", color: "gray" },
};

const COLOR_CLASSES: Record<string, string> = {
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  orange: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  gray: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  const { author, body, createdAt, agentType } = message;

  if (!body.trim()) return null;

  const getAgentBadge = () => {
    if (!agentType) return null;

    const config = AGENT_BADGE_CONFIG[agentType] || { label: "Agent", color: "gray" };
    const colorClass = COLOR_CLASSES[config.color] || COLOR_CLASSES.gray;

    return (
      <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", colorClass)}>
        {config.label}
      </span>
    );
  };

  return (
    <div
      className={cn(
        "flex gap-2",
        isCurrentUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <img
        src={author.avatarUrl}
        alt={author.login}
        className="mt-1 h-7 w-7 shrink-0 rounded-full"
      />

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[80%] space-y-1",
          isCurrentUser ? "items-end" : "items-start"
        )}
      >
        <div className="flex items-center gap-2">
          {agentType ? (
            getAgentBadge()
          ) : (
            <span className="text-xs font-medium text-muted-foreground">
              {author.login}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground/60">
            {formatRelativeTime(createdAt)}
          </span>
        </div>

        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm",
            isCurrentUser
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-bl-md bg-secondary text-secondary-foreground"
          )}
        >
          <div
            className={cn(
              "prose prose-sm max-w-none",
              isCurrentUser
                ? "prose-invert"
                : "dark:prose-invert"
            )}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {body}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Message } from "@/lib/types";

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
}

export function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  const { author, body, createdAt } = message;

  if (!body.trim()) return null;

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
          <span className="text-xs font-medium text-muted-foreground">
            {author.isBot ? "Agent" : author.login}
          </span>
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

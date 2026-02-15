"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMessages, sendMessage } from "@/hooks/use-messages";
import { useSession } from "@/hooks/use-session";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { ArrowLeft, GitPullRequest, CircleDot, ExternalLink } from "lucide-react";
import type { Message } from "@/lib/types";

function parseConversationId(id: string) {
  // Format: owner-repo-type-number
  // But owner and repo can contain hyphens, so we parse from the end
  const parts = id.split("-");
  const number = parseInt(parts.pop()!, 10);
  const type = parts.pop()!; // "issue" or "pr"
  // Everything remaining is owner-repo, split on first hyphen... actually this is tricky.
  // Let's use a different approach: find "issue" or "pr" and split around it
  const joinedBack = parts.join("-");
  // Find the last occurrence of the owner/repo separator
  // We stored it as owner-repo, so we need to find the slash equivalent
  // Actually, in our ID format we used "-" throughout. Let's find owner/repo from the session tracked repos.
  // Simpler: just split on first hyphen for owner, rest is repo
  const firstHyphen = joinedBack.indexOf("-");
  const owner = joinedBack.slice(0, firstHyphen);
  const repo = joinedBack.slice(firstHyphen + 1);

  return { owner, repo, type, number };
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useSession();
  const id = params.id as string;

  const { owner, repo, type, number } = parseConversationId(id);
  const { messages, isLoading, mutate } = useMessages(owner, repo, number);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (body: string) => {
    if (!user) return;
    setSending(true);

    // Prepend @claude to trigger the agent workflow
    const messageBody = `@claude ${body}`;

    // Optimistic update
    const optimisticMessage: Message = {
      id: Date.now(),
      author: {
        login: user.login,
        avatarUrl: user.avatar_url,
        isBot: false,
      },
      body: messageBody,
      createdAt: new Date().toISOString(),
      type: "comment",
    };

    mutate([...messages, optimisticMessage], false);

    await sendMessage(owner, repo, number, messageBody);
    setSending(false);
    mutate(); // Revalidate with server data
  };

  const title = messages.length > 0 ? "" : "Loading...";
  const githubUrl = `https://github.com/${owner}/${repo}/${type === "pr" ? "pull" : "issues"}/${number}`;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {type === "pr" ? (
                <GitPullRequest className="h-4 w-4 shrink-0 text-purple-500" />
              ) : (
                <CircleDot className="h-4 w-4 shrink-0 text-green-500" />
              )}
              <span className="truncate text-sm font-semibold">
                {owner}/{repo} #{number}
              </span>
            </div>
          </div>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isCurrentUser={!msg.author.isBot && msg.author.login === user?.login}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0">
        <ChatInput
          onSend={handleSend}
          disabled={sending}
          placeholder="Reply to agent..."
        />
      </div>
    </div>
  );
}

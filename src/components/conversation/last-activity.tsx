"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface LastActivityProps {
  timestamp: string | null;
}

export function LastActivity({ timestamp }: LastActivityProps) {
  const [relativeTime, setRelativeTime] = useState<string>("");

  useEffect(() => {
    if (!timestamp) return;

    // Initial render
    setRelativeTime(formatRelativeTime(timestamp));

    // Update every 30 seconds to keep the relative time fresh
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(timestamp));
    }, 30_000);

    return () => clearInterval(interval);
  }, [timestamp]);

  // Don't render during loading state (no timestamp)
  if (!timestamp || !relativeTime) return null;

  return (
    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="h-3 w-3" />
      <span>Last activity: {relativeTime}</span>
    </div>
  );
}

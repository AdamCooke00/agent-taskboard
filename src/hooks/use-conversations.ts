"use client";

import useSWR from "swr";
import type { Conversation } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useConversations() {
  const { data, error, isLoading, mutate } = useSWR<Conversation[]>(
    "/api/github/conversations",
    fetcher,
    { refreshInterval: 30_000 } // Poll every 30 seconds
  );
  return { conversations: data ?? [], isLoading, error, mutate };
}

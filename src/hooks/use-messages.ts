"use client";

import useSWR from "swr";
import type { Message } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useMessages(owner: string, repo: string, number: number) {
  const { data, error, isLoading, mutate } = useSWR<Message[]>(
    `/api/github/messages?owner=${owner}&repo=${repo}&number=${number}`,
    fetcher,
    { refreshInterval: 10_000 } // Poll every 10 seconds for active conversations
  );
  return { messages: data ?? [], isLoading, error, mutate };
}

export async function sendMessage(
  owner: string,
  repo: string,
  number: number,
  body: string
) {
  const res = await fetch("/api/github/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ owner, repo, number, body }),
  });
  return res.json();
}

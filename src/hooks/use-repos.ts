"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useRepos() {
  const { data, error, isLoading } = useSWR("/api/github/repos", fetcher);
  return { repos: data ?? [], isLoading, error };
}

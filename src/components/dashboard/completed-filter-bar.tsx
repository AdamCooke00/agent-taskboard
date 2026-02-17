"use client";

import { CircleDot, GitPullRequest, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompletedFilters {
  type: "all" | "issue" | "pull_request";
  repo: string; // "all" or "owner/repo"
  timeRange: "24h" | "7d" | "30d" | "all";
}

interface CompletedFilterBarProps {
  filters: CompletedFilters;
  trackedRepos: string[];
  onFilterChange: (filterKey: keyof CompletedFilters, value: string) => void;
}

export function CompletedFilterBar({
  filters,
  trackedRepos,
  onFilterChange,
}: CompletedFilterBarProps) {
  const typeFilters = [
    { value: "all", label: "All", icon: null },
    { value: "issue", label: "Issues", icon: CircleDot },
    { value: "pull_request", label: "PRs", icon: GitPullRequest },
  ] as const;

  const timeFilters = [
    { value: "24h", label: "24h" },
    { value: "7d", label: "7d" },
    { value: "30d", label: "30d" },
    { value: "all", label: "All" },
  ] as const;

  const FilterChip = ({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "border border-input hover:bg-accent"
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-3 border-b pb-4">
      {/* Type filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {typeFilters.map((filter) => {
          const Icon = filter.icon;
          return (
            <FilterChip
              key={filter.value}
              active={filters.type === filter.value}
              onClick={() => onFilterChange("type", filter.value)}
            >
              <span className="flex items-center gap-1.5">
                {Icon && <Icon className="h-3 w-3" />}
                {filter.label}
              </span>
            </FilterChip>
          );
        })}
      </div>

      {/* Repo filter - only show if more than 1 tracked repo */}
      {trackedRepos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <FilterChip
            active={filters.repo === "all"}
            onClick={() => onFilterChange("repo", "all")}
          >
            All repos
          </FilterChip>
          {trackedRepos.map((repoFullName) => {
            const shortName = repoFullName.split("/")[1] || repoFullName;
            return (
              <FilterChip
                key={repoFullName}
                active={filters.repo === repoFullName}
                onClick={() => onFilterChange("repo", repoFullName)}
              >
                {shortName}
              </FilterChip>
            );
          })}
        </div>
      )}

      {/* Time range filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        <Clock className="h-4 w-4 shrink-0 text-muted-foreground self-center" />
        {timeFilters.map((filter) => (
          <FilterChip
            key={filter.value}
            active={filters.timeRange === filter.value}
            onClick={() => onFilterChange("timeRange", filter.value)}
          >
            {filter.label}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}

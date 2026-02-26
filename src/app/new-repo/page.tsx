"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, AlertCircle } from "lucide-react";

type PageState = "form" | "creating" | "securing" | "success" | "error";

interface CreatedRepo {
  owner: string;
  name: string;
  fullName: string;
  htmlUrl: string;
}

interface ErrorInfo {
  message: string;
  step: string;
  repo?: CreatedRepo;
}

export default function NewRepoPage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>("form");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState("");
  const [createdRepo, setCreatedRepo] = useState<CreatedRepo | null>(null);
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [tracking, setTracking] = useState(false);

  const validateName = (value: string): boolean => {
    if (!value) {
      setNameError("Repository name is required");
      return false;
    }
    const pattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
    if (!pattern.test(value)) {
      setNameError("Must start with a letter or number and contain only letters, numbers, dots, hyphens, and underscores");
      return false;
    }
    if (value.length > 100) {
      setNameError("Maximum 100 characters");
      return false;
    }
    setNameError("");
    return true;
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (nameError) {
      validateName(value);
    }
  };

  const handleNameBlur = () => {
    validateName(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateName(name)) return;

    // Phase 1: Create repository
    setState("creating");
    try {
      const createRes = await fetch("/api/github/repos/create-from-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || undefined }),
      });

      if (!createRes.ok) {
        const errorData = await createRes.json();
        setError({
          message: errorData.error || "Failed to create repository",
          step: errorData.step || "create",
        });
        setState("error");
        return;
      }

      const repo: CreatedRepo = await createRes.json();
      setCreatedRepo(repo);

      // Phase 2: Apply security settings
      setState("securing");
      const securityRes = await fetch("/api/github/repos/apply-security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: repo.owner, repo: repo.name }),
      });

      if (!securityRes.ok) {
        const errorData = await securityRes.json();
        setError({
          message: errorData.error || "Failed to apply security settings",
          step: errorData.step || "apply_security",
          repo,
        });
        setState("error");
        return;
      }

      setState("success");
    } catch (err) {
      setError({
        message: "An unexpected error occurred",
        step: "unknown",
      });
      setState("error");
    }
  };

  const handleTrackRepo = async () => {
    if (!createdRepo) return;
    setTracking(true);
    try {
      // Get current session to retrieve tracked repos
      const sessionRes = await fetch("/api/session");
      const session = await sessionRes.json();
      const currentTracked = session.trackedRepos || [];

      // Add new repo to tracked list
      const updatedTracked = [...currentTracked, createdRepo.fullName];

      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackedRepos: updatedTracked }),
      });

      router.push("/");
    } catch (err) {
      console.error("Failed to track repo:", err);
      setTracking(false);
    }
  };

  const handleReset = () => {
    setState("form");
    setName("");
    setDescription("");
    setNameError("");
    setCreatedRepo(null);
    setError(null);
  };

  const handleRetrySecuritySetup = async () => {
    if (!createdRepo) return;
    setState("securing");
    setError(null);

    try {
      const securityRes = await fetch("/api/github/repos/apply-security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: createdRepo.owner, repo: createdRepo.name }),
      });

      if (!securityRes.ok) {
        const errorData = await securityRes.json();
        setError({
          message: errorData.error || "Failed to apply security settings",
          step: errorData.step || "apply_security",
          repo: createdRepo,
        });
        setState("error");
        return;
      }

      setState("success");
    } catch (err) {
      setError({
        message: "An unexpected error occurred",
        step: "unknown",
        repo: createdRepo,
      });
      setState("error");
    }
  };

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <button onClick={() => router.back()} className="p-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">Create New Repository</h1>
      </header>

      <div className="flex flex-1 items-center justify-center p-4">
        {/* Form State */}
        {state === "form" && (
          <div className="w-full max-w-md space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium">
                  Repository Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onBlur={handleNameBlur}
                  className={`w-full rounded-lg border px-3 py-2 ${
                    nameError ? "border-destructive" : ""
                  } focus:outline-none focus:ring-2 focus:ring-primary`}
                  placeholder="my-new-project"
                  autoFocus
                />
                {nameError && (
                  <p className="mt-1 text-sm text-destructive">{nameError}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="mb-2 block text-sm font-medium">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="A brief description of your project"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={!name || !!nameError}
                className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground transition-opacity disabled:opacity-50"
              >
                Create Repository
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Creates a private repo from the framework template with security settings.
            </p>
          </div>
        )}

        {/* Creating State */}
        {state === "creating" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Creating repository...</p>
          </div>
        )}

        {/* Securing State */}
        {state === "securing" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Applying security settings...</p>
          </div>
        )}

        {/* Success State */}
        {state === "success" && createdRepo && (
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Repository Created</h2>
                <a
                  href={createdRepo.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-primary hover:underline"
                >
                  {createdRepo.fullName}
                </a>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleTrackRepo}
                disabled={tracking}
                className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground transition-opacity disabled:opacity-50"
              >
                {tracking ? "Tracking..." : "Track this repo"}
              </button>
              <button
                onClick={handleReset}
                className="w-full rounded-lg border px-4 py-2.5 font-medium transition-colors hover:bg-accent"
              >
                Create another
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {state === "error" && error && (
          <div className="w-full max-w-md space-y-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {error.repo ? "Security Setup Failed" : "Creation Failed"}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
                {error.repo && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    The repository was created but may not have all security settings.
                  </p>
                )}
              </div>
            </div>

            {error.repo && (
              <a
                href={error.repo.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-primary hover:underline"
              >
                View repository: {error.repo.fullName}
              </a>
            )}

            <div className="space-y-2">
              {error.repo && error.step.includes("security") ? (
                <button
                  onClick={handleRetrySecuritySetup}
                  className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground"
                >
                  Retry Security Setup
                </button>
              ) : (
                <button
                  onClick={handleReset}
                  className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={() => router.back()}
                className="w-full rounded-lg border px-4 py-2.5 font-medium transition-colors hover:bg-accent"
              >
                Go Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

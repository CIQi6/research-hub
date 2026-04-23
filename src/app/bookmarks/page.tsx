"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { ResourceSummary } from "@/lib/resource-types.ts";
import { ResourceCard } from "@/components/resource-card";

export default function BookmarksPage() {
  const { data: session, status } = useSession();
  const [resources, setResources] = useState<ResourceSummary[] | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/me/bookmarks")
      .then((response) => response.json())
      .then((data) => {
        setResources(Array.isArray(data) ? data : []);
      });
  }, [status]);

  if (status === "loading" || (status === "authenticated" && resources === null)) {
    return <div className="py-20 text-center text-muted-foreground">Loading bookmarks...</div>;
  }

  if (!session?.user) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Sign in to view your bookmarks.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Bookmarks</h1>
        <p className="mt-1 text-muted-foreground">
          Quick access to resources you saved for later.
        </p>
      </div>

      {resources && resources.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          No bookmarks yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {(resources ?? []).map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </div>
  );
}

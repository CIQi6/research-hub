"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { ResourceSummary } from "@/lib/resource-types.ts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResourceCard } from "@/components/resource-card";
import { ResourceEditor, type ResourceEditorValue } from "@/components/resource-editor";

export function EditProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [field, setField] = useState("");
  const [resources, setResources] = useState<ResourceSummary[]>([]);
  const [editingResource, setEditingResource] = useState<ResourceSummary | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [resourceSaving, setResourceSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [resourceError, setResourceError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.github_id && !loaded) {
      Promise.all([
        fetch(`/api/members/${session.user.github_id}`).then((r) =>
          r.ok ? r.json() : null
        ),
        fetch(`/api/members/${session.user.github_id}/resources`).then((r) =>
          r.ok ? r.json() : []
        ),
      ]).then(([member, resourceData]) => {
        if (member) {
          setField(member.field || "");
        }
        setResources(Array.isArray(resourceData) ? resourceData : []);
        setLoaded(true);
      });
    }
  }, [session, loaded]);

  async function reloadResources() {
    if (!session?.user?.github_id) return;
    const response = await fetch(`/api/members/${session.user.github_id}/resources`);
    const data = await response.json();
    setResources(Array.isArray(data) ? data : []);
  }

  async function handleProfileSave() {
    setProfileSaving(true);
    setProfileError("");

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        setProfileError(payload?.error ?? "Profile update failed");
        return;
      }

      router.refresh();
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleResourceSubmit(value: ResourceEditorValue) {
    setResourceSaving(true);
    setResourceError("");
    const endpoint = editingResource
      ? `/api/resources/${editingResource.id}`
      : "/api/resources";
    const method = editingResource ? "PATCH" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setResourceError(payload?.error ?? "Resource publish failed");
        return;
      }

      setEditingResource(null);
      await reloadResources();
    } finally {
      setResourceSaving(false);
    }
  }

  async function handleDeleteResource(resourceId: string) {
    const response = await fetch(`/api/resources/${resourceId}`, {
      method: "DELETE",
    });
    if (response.ok) {
      await reloadResources();
    }
  }

  if (status === "loading" || !loaded) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Edit Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as <strong>{session.user.github_username}</strong>
        </p>
      </div>

      <div className="rounded-xl border p-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">Research Field</label>
          <Input
            placeholder="e.g. Machine Learning, Computer Networks..."
            value={field}
            onChange={(e) => setField(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="mt-4 flex gap-3">
          <Button onClick={handleProfileSave} disabled={profileSaving}>
            {profileSaving ? "Saving..." : "Save profile"}
          </Button>
        </div>
        {profileError ? (
          <p className="mt-3 text-sm text-destructive">{profileError}</p>
        ) : null}
      </div>

      <ResourceEditor
        key={editingResource?.id ?? "new"}
        title={editingResource ? "Edit resource" : "Publish a resource"}
        description="Manual metadata only: title, link, type, summary, and comma-separated tags."
        submitLabel={editingResource ? "Update resource" : "Publish resource"}
        pending={resourceSaving}
        initialValue={
          editingResource
            ? {
                title: editingResource.title,
                url: editingResource.url,
                type: editingResource.type,
                summary: editingResource.summary,
                tags: editingResource.tags.map((tag) => tag.name).join(", "),
              }
            : undefined
        }
        onSubmit={handleResourceSubmit}
        onCancel={editingResource ? () => setEditingResource(null) : undefined}
      />
      {resourceError ? (
        <p className="-mt-4 text-sm text-destructive">{resourceError}</p>
      ) : null}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">My published resources</h3>
          <p className="text-sm text-muted-foreground">
            Manage the resources attached to your author profile.
          </p>
        </div>

        {resources.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            No resources published yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {resources.map((resource) => (
              <div key={resource.id} className="space-y-3 rounded-xl border p-4">
                <ResourceCard resource={resource} />
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingResource(resource)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteResource(resource.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

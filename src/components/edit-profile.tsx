"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Resource {
  title: string;
  url: string;
}

export function EditProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [field, setField] = useState("");
  const [resources, setResources] = useState<Resource[]>([{ title: "", url: "" }]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.github_id && !loaded) {
      fetch(`/api/members/${session.user.github_id}`)
        .then((r) => {
          if (r.ok) return r.json();
          return null;
        })
        .then((data) => {
          if (data) {
            setField(data.field || "");
            setResources(
              data.resources?.length > 0
                ? data.resources
                : [{ title: "", url: "" }]
            );
          }
          setLoaded(true);
        });
    }
  }, [session, loaded]);

  function addResource() {
    setResources([...resources, { title: "", url: "" }]);
  }

  function removeResource(index: number) {
    setResources(resources.filter((_, i) => i !== index));
  }

  function updateResource(index: number, key: keyof Resource, value: string) {
    const updated = [...resources];
    updated[index] = { ...updated[index], [key]: value };
    setResources(updated);
  }

  async function handleSave() {
    setSaving(true);

    const validResources = resources.filter(
      (r) => r.title.trim() && r.url.trim()
    );

    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, resources: validResources }),
    });

    setSaving(false);

    if (res.ok) {
      router.push("/");
      router.refresh();
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

      <div className="space-y-2">
        <label className="text-sm font-medium">Research Field</label>
        <Input
          placeholder="e.g. Machine Learning, Computer Networks..."
          value={field}
          onChange={(e) => setField(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Resources</label>
        {resources.map((r, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Title"
                value={r.title}
                onChange={(e) => updateResource(i, "title", e.target.value)}
              />
              <Input
                placeholder="URL (https://...)"
                value={r.url}
                onChange={(e) => updateResource(i, "url", e.target.value)}
              />
            </div>
            {resources.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeResource(i)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                Remove
              </Button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addResource}>
          + Add Resource
        </Button>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button variant="ghost" onClick={() => router.push("/")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

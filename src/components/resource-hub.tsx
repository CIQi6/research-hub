"use client";

import { useDeferredValue, useEffect, useState } from "react";
import Link from "next/link";
import type { MemberSummary, ResourceSummary, ResourceTag, ResourceType } from "@/lib/resource-types.ts";
import { ResourceCard } from "@/components/resource-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const FILTER_OPTIONS: Array<{ value: "all" | ResourceType; label: string }> = [
  { value: "all", label: "All" },
  { value: "pdf", label: "PDF" },
  { value: "web", label: "网页" },
  { value: "audio", label: "音频" },
  { value: "video", label: "视频" },
  { value: "ebook", label: "电子书" },
];

export function ResourceHub() {
  const [resources, setResources] = useState<ResourceSummary[]>([]);
  const [tags, setTags] = useState<ResourceTag[]>([]);
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | ResourceType>("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [loading, setLoading] = useState(true);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    fetch("/api/tags")
      .then((response) => response.json())
      .then((data) => setTags(Array.isArray(data) ? data : []));

    fetch("/api/members")
      .then((response) => response.json())
      .then((data) => setMembers(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (deferredSearch.trim()) params.set("q", deferredSearch.trim());
    if (selectedType !== "all") params.set("type", selectedType);
    if (selectedTag !== "all") params.set("tag", selectedTag);

    fetch(`/api/resources?${params.toString()}`)
      .then((response) => response.json())
      .then((data) => {
        setResources(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [deferredSearch, selectedTag, selectedType]);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
            Resource Center
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">
            Browse PDF, web, audio, video, and ebook references from your research network.
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            The hub leads with resources, while active members stay visible on the same screen.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <Input
            placeholder="Search by title or summary..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setLoading(true);
            }}
          />
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setSelectedType(option.value);
                  setLoading(true);
                }}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  selectedType === option.value
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedTag("all")}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              selectedTag === "all"
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background text-foreground hover:bg-muted"
            }`}
          >
            All tags
          </button>
          {tags.map((tag) => (
            <button
            key={tag.id}
              type="button"
              onClick={() => {
                setSelectedTag(tag.slug);
                setLoading(true);
              }}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                selectedTag === tag.slug
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Latest resources</h2>
              <p className="text-sm text-muted-foreground">
                {loading ? "Loading..." : `${resources.length} items`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-muted-foreground">Loading resources...</div>
          ) : resources.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              No resources match the current filters.
            </div>
          ) : (
            <div className="grid gap-4">
              {resources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          )}
        </div>

        <Card className="border">
          <CardHeader>
            <CardTitle className="text-xl">Active members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {members.slice(0, 8).map((member) => (
              <Link
                key={member.github_id}
                href={`/member/${member.github_id}`}
                className="flex items-start gap-3 rounded-xl border p-3 transition hover:bg-muted/50"
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={member.avatar_url ?? undefined} />
                  <AvatarFallback>
                    {member.github_username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{member.github_username}</p>
                    <Badge variant="outline">
                      {member.resource_count ?? 0} resources
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {member.field || "No field shared yet"}
                  </p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ResourceSummary } from "@/lib/resource-types.ts";
import { BookmarkButton } from "@/components/bookmark-button";
import { ResourceComments } from "@/components/resource-comments";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ResourceDetailProps {
  resourceId: string;
}

export function ResourceDetail({ resourceId }: ResourceDetailProps) {
  const [resource, setResource] = useState<ResourceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/resources/${resourceId}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        setResource(data);
        setLoading(false);
      });
  }, [resourceId]);

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground">Loading resource...</div>;
  }

  if (!resource) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Resource not found.</p>
        <Link href="/" className="mt-3 inline-block text-sm underline">
          Back to hub
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        &larr; Back to hub
      </Link>

      <Card className="border">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{resource.type.toUpperCase()}</Badge>
            {resource.tags.map((tag) => (
              <Badge key={tag.id} variant="outline">
                {tag.name}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-3xl">{resource.title}</CardTitle>
              <CardDescription className="max-w-3xl text-base">
                {resource.summary}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-3">
              <BookmarkButton
                resourceId={resource.id}
                initialBookmarked={resource.is_bookmarked}
              />
              <Button
                render={
                  <a href={resource.url} target="_blank" rel="noopener noreferrer" />
                }
              >
                Open original
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-sm leading-7 text-foreground/90">{resource.summary}</p>
            </div>
            <div className="rounded-xl border border-dashed p-4">
              <p className="text-sm font-medium">Related resources</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Reserved for the next phase. This release keeps the slot but does not run recommendation logic.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="border">
              <CardHeader>
                <CardTitle className="text-lg">Author</CardTitle>
              </CardHeader>
              <CardContent className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={resource.owner.avatar_url ?? undefined} />
                  <AvatarFallback>
                    {resource.owner.github_username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <Link
                    href={`/member/${resource.owner.github_id}`}
                    className="font-medium hover:underline"
                  >
                    {resource.owner.github_username}
                  </Link>
                  <p className="text-sm text-muted-foreground">{resource.owner.field || "No field set yet"}</p>
                  <p className="text-xs text-muted-foreground">
                    Updated {new Date(resource.updated_at).toLocaleDateString("en-US")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <ResourceComments resourceId={resource.id} />
    </div>
  );
}

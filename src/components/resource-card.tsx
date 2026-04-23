"use client";

import Link from "next/link";
import { ExternalLinkIcon, MessageSquareIcon } from "lucide-react";
import type { ResourceSummary } from "@/lib/resource-types.ts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ResourceCardProps {
  resource: ResourceSummary;
  showOwner?: boolean;
}

const RESOURCE_TYPE_LABELS: Record<ResourceSummary["type"], string> = {
  pdf: "PDF",
  web: "网页",
  audio: "音频",
  video: "视频",
  ebook: "电子书",
};

export function ResourceCard({
  resource,
  showOwner = true,
}: ResourceCardProps) {
  return (
    <Card className="border">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{RESOURCE_TYPE_LABELS[resource.type]}</Badge>
            {resource.tags.slice(0, 3).map((tag) => (
              <Badge key={tag.id} variant="outline">
                {tag.name}
              </Badge>
            ))}
          </div>
          <CardAction>
            <Button
              render={
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <ExternalLinkIcon />
              Open
            </Button>
          </CardAction>
        </div>
        <CardTitle>
          <Link href={`/resource/${resource.id}`} className="hover:underline">
            {resource.title}
          </Link>
        </CardTitle>
        <CardDescription>{resource.summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {showOwner && (
          <p className="text-sm text-muted-foreground">
            By{" "}
            <Link href={`/member/${resource.owner.github_id}`} className="font-medium text-foreground hover:underline">
              {resource.owner.github_username}
            </Link>
          </p>
        )}
        <p className="truncate text-xs text-muted-foreground">{resource.url}</p>
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{new Date(resource.updated_at).toLocaleDateString("en-US")}</span>
          <span className="inline-flex items-center gap-1">
            <MessageSquareIcon className="size-3.5" />
            {resource.comment_count}
          </span>
        </div>
        <Link
          href={`/resource/${resource.id}`}
          className="text-xs font-medium text-foreground underline-offset-4 hover:underline"
        >
          View details
        </Link>
      </CardFooter>
    </Card>
  );
}

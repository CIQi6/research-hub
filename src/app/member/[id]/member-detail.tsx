"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Comments } from "@/components/comments";

interface Resource {
  title: string;
  url: string;
}

interface Member {
  github_id: number;
  github_username: string;
  avatar_url: string;
  field: string;
  resources: Resource[];
  created_at: string;
  updated_at: string;
}

export function MemberDetail({ memberId }: { memberId: string }) {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/members/${memberId}`)
      .then((r) => {
        if (r.ok) return r.json();
        return null;
      })
      .then((data) => {
        setMember(data);
        setLoading(false);
      });
  }, [memberId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!member) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Member not found.</p>
        <Link href="/" className="mt-2 inline-block text-sm underline">
          Back to members
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link
        href="/"
        className="inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Back
      </Link>

      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={member.avatar_url} />
          <AvatarFallback className="text-xl">
            {member.github_username[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {member.github_username}
          </h1>
          {member.field && (
            <Badge variant="secondary" className="mt-1">
              {member.field}
            </Badge>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Joined{" "}
            {new Date(member.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {member.resources?.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Shared Resources
          </h2>
          <div className="space-y-2">
            {member.resources.map((r, i) => (
              <a
                key={i}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-md border p-3 transition-colors hover:bg-accent/50"
              >
                <p className="font-medium">{r.title}</p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {r.url}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}

      <Separator />

      <Comments targetGithubId={member.github_id} />
    </div>
  );
}

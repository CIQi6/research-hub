"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { MemberSummary } from "@/lib/resource-types.ts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface MemberListProps {
  initialMembers?: MemberSummary[];
  compact?: boolean;
  hideSearch?: boolean;
}

export function MemberList({
  initialMembers,
  compact = false,
  hideSearch = false,
}: MemberListProps) {
  const [members, setMembers] = useState<MemberSummary[]>(initialMembers ?? []);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(!initialMembers);

  useEffect(() => {
    if (initialMembers) return;

    fetch("/api/members")
      .then((r) => r.json())
      .then((data) => {
        setMembers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [initialMembers]);

  const filtered = members.filter(
    (m) =>
      m.github_username.toLowerCase().includes(search.toLowerCase()) ||
      m.field.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!hideSearch && (
        <Input
          placeholder="Search by name or research field..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      )}

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">
          {members.length === 0
            ? "No members yet. Sign in with GitHub to be the first!"
            : "No results found."}
        </p>
      ) : (
        <div className={`grid gap-4 ${compact ? "" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
          {filtered.map((member) => (
            <Link
              key={member.github_id}
              href={`/member/${member.github_id}`}
              className="group rounded-lg border bg-card p-5 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={member.avatar_url ?? undefined} />
                  <AvatarFallback>
                    {member.github_username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-tight group-hover:underline">
                    {member.github_username}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {member.field && (
                      <Badge variant="secondary" className="text-xs">
                        {member.field}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {member.resource_count ?? 0} resources
                    </Badge>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

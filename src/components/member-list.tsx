"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

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
  updated_at: string;
}

export function MemberList() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then((data) => {
        setMembers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
      <Input
        placeholder="Search by name or research field..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">
          {members.length === 0
            ? "No members yet. Sign in with GitHub to be the first!"
            : "No results found."}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member) => (
            <Link
              key={member.github_id}
              href={`/member/${member.github_id}`}
              className="group rounded-lg border bg-card p-5 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={member.avatar_url} />
                  <AvatarFallback>
                    {member.github_username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-tight group-hover:underline">
                    {member.github_username}
                  </p>
                  {member.field && (
                    <Badge variant="secondary" className="mt-1.5 text-xs">
                      {member.field}
                    </Badge>
                  )}
                </div>
              </div>

              {member.resources?.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  {member.resources.slice(0, 3).map((r, i) => (
                    <p
                      key={i}
                      className="truncate text-sm text-muted-foreground"
                    >
                      {r.title}
                    </p>
                  ))}
                  {member.resources.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{member.resources.length - 3} more
                    </p>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

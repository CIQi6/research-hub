"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { formatTimeAgo, type ResourceComment } from "@/lib/resource-types.ts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface ResourceCommentsProps {
  resourceId: string;
}

export function ResourceComments({ resourceId }: ResourceCommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<ResourceComment[]>([]);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [nowMs, setNowMs] = useState(0);

  useEffect(() => {
    let active = true;

    async function fetchComments() {
      const response = await fetch(`/api/resources/${resourceId}/comments`);
      const data = await response.json();
      const responseDate = response.headers.get("date");

      if (active && Array.isArray(data)) {
        setComments(data);
        setNowMs(responseDate ? Date.parse(responseDate) : 0);
      }
    }

    void fetchComments();

    return () => {
      active = false;
    };
  }, [resourceId]);

  async function loadComments() {
    const response = await fetch(`/api/resources/${resourceId}/comments`);
    const data = await response.json();
    const responseDate = response.headers.get("date");

    if (Array.isArray(data)) {
      setComments(data);
      setNowMs(responseDate ? Date.parse(responseDate) : 0);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    const response = await fetch(`/api/resources/${resourceId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (response.ok) {
      setContent("");
      await loadComments();
    }

    setSubmitting(false);
  }

  async function handleDelete(commentId: string) {
    const response = await fetch(
      `/api/resources/${resourceId}/comments/${commentId}`,
      { method: "DELETE" }
    );

    if (response.ok) {
      await loadComments();
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-medium">Resource discussion</h3>
        <p className="text-xs text-muted-foreground">{comments.length} comments</p>
      </div>

      {session?.user && (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={session.user.avatar_url} />
            <AvatarFallback>
              {session.user.github_username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              rows={3}
              placeholder="Leave a note about this resource..."
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
            <Button type="submit" size="sm" disabled={submitting || !content.trim()}>
              {submitting ? "Posting..." : "Post comment"}
            </Button>
          </div>
        </form>
      )}

      {comments.length > 0 && <Separator />}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={comment.author_avatar ?? undefined} />
              <AvatarFallback>
                {comment.author_username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{comment.author_username}</span>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(comment.created_at, nowMs || new Date(comment.created_at).getTime())}
                </span>
                {session?.user?.github_id === comment.author_github_id && (
                  <button
                    type="button"
                    onClick={() => handleDelete(comment.id)}
                    className="ml-auto text-xs text-muted-foreground hover:text-destructive"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">
                {comment.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

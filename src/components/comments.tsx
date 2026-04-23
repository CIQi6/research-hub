"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { formatTimeAgo } from "@/lib/resource-types.ts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface Comment {
  id: string;
  author_github_id: number;
  author_username: string;
  author_avatar: string;
  content: string;
  created_at: string;
}

export function Comments({ targetGithubId }: { targetGithubId: number }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [nowMs, setNowMs] = useState(0);

  const loadComments = useCallback(() => {
    fetch(`/api/comments?target_github_id=${targetGithubId}`)
      .then(async (r) => ({
        data: await r.json(),
        responseDate: r.headers.get("date"),
      }))
      .then(({ data, responseDate }) => {
        if (Array.isArray(data)) {
          setComments(data);
          setNowMs(responseDate ? Date.parse(responseDate) : 0);
        }
      });
  }, [targetGithubId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_github_id: targetGithubId, content }),
    });

    if (res.ok) {
      setContent("");
      loadComments();
    }
    setSubmitting(false);
  }

  async function handleDelete(commentId: string) {
    const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    if (res.ok) {
      loadComments();
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Comments ({comments.length})
      </h3>

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
              placeholder="Leave a comment..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={2}
              className="resize-none"
            />
            <Button type="submit" size="sm" disabled={!content.trim() || submitting}>
              {submitting ? "Posting..." : "Post"}
            </Button>
          </div>
        </form>
      )}

      {comments.length > 0 && <Separator />}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={comment.author_avatar ?? undefined} />
              <AvatarFallback>
                {comment.author_username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {comment.author_username}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(comment.created_at, nowMs || new Date(comment.created_at).getTime())}
                </span>
                {session?.user?.github_id === comment.author_github_id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="ml-auto text-xs text-muted-foreground hover:text-destructive"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="mt-0.5 text-sm leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

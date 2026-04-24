"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { buildCommentThreads } from "@/lib/comment-thread.ts";
import { formatTimeAgo } from "@/lib/resource-types.ts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface Comment {
  id: string;
  author_github_id: number;
  author_username: string;
  author_avatar: string | null;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
}

export function Comments({ targetGithubId }: { targetGithubId: number }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [nowMs, setNowMs] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchComments() {
      try {
        const response = await fetch(`/api/comments?target_github_id=${targetGithubId}`);
        if (!response.ok) {
          throw new Error("Comments request failed");
        }

        const data = await response.json();
        const responseDate = response.headers.get("date");
        if (active && Array.isArray(data)) {
          setComments(data);
          setNowMs(responseDate ? Date.parse(responseDate) : 0);
          setError("");
        }
      } catch {
        if (active) {
          setError("留言加载失败。");
        }
      }
    }

    void fetchComments();

    return () => {
      active = false;
    };
  }, [targetGithubId]);

  async function loadComments() {
    try {
      const response = await fetch(`/api/comments?target_github_id=${targetGithubId}`);
      if (!response.ok) {
        throw new Error("Comments request failed");
      }

      const data = await response.json();
      const responseDate = response.headers.get("date");
      if (Array.isArray(data)) {
        setComments(data);
        setNowMs(responseDate ? Date.parse(responseDate) : 0);
        setError("");
      }
    } catch {
      setError("留言加载失败。");
    }
  }

  async function submitComment(nextContent: string, parentCommentId?: string) {
    if (!nextContent.trim() || submitting) return;

    try {
      setSubmitting(true);
      setError("");
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_github_id: targetGithubId,
          content: nextContent,
          ...(parentCommentId ? { parent_comment_id: parentCommentId } : {}),
        }),
      });

      if (!res.ok) {
        throw new Error("Comment submit failed");
      }

      if (parentCommentId) {
        setReplyContent("");
        setReplyingTo(null);
      } else {
        setContent("");
      }
      await loadComments();
    } catch {
      setError("留言发布失败，请重试。");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submitComment(content);
  }

  async function handleDelete(commentId: string) {
    if (!window.confirm("确认删除这条留言？")) return;

    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Comment delete failed");
      }

      await loadComments();
    } catch {
      setError("留言删除失败，请重试。");
    }
  }

  const threads = buildCommentThreads(comments);

  function renderComment(comment: Comment, isReply = false) {
    const canDelete = session?.user?.github_id === comment.author_github_id;
    const canReply = Boolean(session?.user) && !isReply;

    return (
      <div key={comment.id} className="flex gap-3">
        <Avatar className={isReply ? "h-6 w-6 shrink-0" : "h-7 w-7 shrink-0"}>
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
            {(canReply || canDelete) && (
              <div className="ml-auto flex items-center gap-3">
                {canReply && (
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingTo((current) => (current === comment.id ? null : comment.id));
                      setReplyContent("");
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {replyingTo === comment.id ? "取消回复" : "回复"}
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDelete(comment.id)}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    删除
                  </button>
                )}
              </div>
            )}
          </div>
          <p className="mt-0.5 text-sm leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        留言（{comments.length}）
      </h3>

      {error ? <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

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
              placeholder="写一条留言..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={2}
              className="resize-none"
            />
            <Button type="submit" size="sm" disabled={!content.trim() || submitting}>
              {submitting ? "发布中..." : "发布"}
            </Button>
          </div>
        </form>
      )}

      {comments.length > 0 && <Separator />}

      <div className="space-y-4">
        {threads.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            还没有留言。
          </p>
        ) : (
          threads.map((thread) => (
            <div key={thread.comment.id} className="space-y-3">
              {renderComment(thread.comment)}
              {replyingTo === thread.comment.id && session?.user ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submitComment(replyContent, thread.comment.id);
                  }}
                  className="ml-10 flex gap-3 border-l pl-4"
                >
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarImage src={session.user.avatar_url} />
                    <AvatarFallback>
                      {session.user.github_username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder={`回复 ${thread.comment.author_username}`}
                      value={replyContent}
                      onChange={(event) => setReplyContent(event.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!replyContent.trim() || submitting}
                      >
                        {submitting ? "回复中..." : "回复"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent("");
                        }}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                </form>
              ) : null}
              {thread.replies.length > 0 ? (
                <div className="ml-10 space-y-3 border-l pl-4">
                  {thread.replies.map((reply) => renderComment(reply, true))}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

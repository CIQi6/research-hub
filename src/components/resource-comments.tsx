"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { MessageSquareIcon } from "lucide-react";
import { buildCommentThreads } from "@/lib/comment-thread.ts";
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
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [nowMs, setNowMs] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchComments() {
      try {
        const response = await fetch(`/api/resources/${resourceId}/comments`);
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
          setError("评论加载失败。");
        }
      }
    }

    void fetchComments();

    return () => {
      active = false;
    };
  }, [resourceId]);

  async function loadComments() {
    const response = await fetch(`/api/resources/${resourceId}/comments`);
    if (!response.ok) {
      throw new Error("Comments request failed");
    }

    const data = await response.json();
    const responseDate = response.headers.get("date");

    if (Array.isArray(data)) {
      setComments(data);
      setNowMs(responseDate ? Date.parse(responseDate) : 0);
    }
  }

  async function submitComment(nextContent: string, parentCommentId?: string) {
    if (!nextContent.trim() || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/resources/${resourceId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: nextContent,
          ...(parentCommentId ? { parent_comment_id: parentCommentId } : {}),
        }),
      });

      if (!response.ok) {
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
      setError("评论发布失败，请重试。");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitComment(content);
  }

  async function handleDelete(commentId: string) {
    if (!window.confirm("确认删除这条评论？")) return;

    try {
      const response = await fetch(
        `/api/resources/${resourceId}/comments/${commentId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Comment delete failed");
      }

      await loadComments();
    } catch {
      setError("评论删除失败，请重试。");
    }
  }

  const threads = buildCommentThreads(comments);

  function renderComment(comment: ResourceComment, isReply = false) {
    const canDelete = session?.user?.github_id === comment.author_github_id;
    const canReply = Boolean(session?.user) && !isReply;

    return (
      <div key={comment.id} className="flex gap-3">
        <Avatar className={isReply ? "h-7 w-7 shrink-0" : "h-8 w-8 shrink-0"}>
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
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">
            {comment.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-medium">资源讨论</h3>
        <p className="text-xs text-muted-foreground">{comments.length} 条评论</p>
      </div>

      {error ? <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      {session?.user ? (
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
              placeholder="写下你对这条资源的补充或判断"
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
            <Button type="submit" size="sm" disabled={submitting || !content.trim()}>
              {submitting ? "发布中..." : "发布评论"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed p-4">
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquareIcon className="size-4" />
            登录后可以参与讨论、回复和收藏资源。
          </p>
          <Button type="button" size="sm" onClick={() => void signIn("github")}>
            GitHub 登录
          </Button>
        </div>
      )}

      {comments.length > 0 && <Separator />}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            还没有讨论。
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
                  className="ml-11 flex gap-3 border-l pl-4"
                >
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={session.user.avatar_url} />
                    <AvatarFallback>
                      {session.user.github_username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      rows={2}
                      placeholder={`回复 ${thread.comment.author_username}`}
                      value={replyContent}
                      onChange={(event) => setReplyContent(event.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={submitting || !replyContent.trim()}
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
                <div className="ml-11 space-y-3 border-l pl-4">
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

"use client";

import { signIn, useSession } from "next-auth/react";
import { useState } from "react";
import { BookmarkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BookmarkButtonProps {
  resourceId: string;
  initialBookmarked: boolean;
}

export function BookmarkButton({
  resourceId,
  initialBookmarked,
}: BookmarkButtonProps) {
  const { data: session } = useSession();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function toggleBookmark() {
    if (!session?.user || pending) return;

    setPending(true);
    setError("");

    try {
      const method = bookmarked ? "DELETE" : "POST";
      const res = await fetch(`/api/resources/${resourceId}/bookmark`, { method });

      if (!res.ok) {
        throw new Error("Bookmark request failed");
      }

      setBookmarked((current) => !current);
    } catch {
      setError("收藏失败，请重试。");
    } finally {
      setPending(false);
    }
  }

  if (!session?.user) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => void signIn("github")}
        className="gap-1.5"
      >
        <BookmarkIcon />
        登录后收藏
      </Button>
    );
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant={bookmarked ? "secondary" : "outline"}
        size="sm"
        disabled={pending}
        onClick={toggleBookmark}
        className="gap-1.5"
      >
        <BookmarkIcon className={bookmarked ? "fill-current" : ""} />
        {pending ? "处理中..." : bookmarked ? "已收藏" : "收藏"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

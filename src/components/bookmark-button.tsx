"use client";

import { useSession } from "next-auth/react";
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

  async function toggleBookmark() {
    if (!session?.user || pending) return;

    setPending(true);
    const method = bookmarked ? "DELETE" : "POST";
    const res = await fetch(`/api/resources/${resourceId}/bookmark`, { method });

    if (res.ok) {
      setBookmarked((current) => !current);
    }

    setPending(false);
  }

  return (
    <Button
      type="button"
      variant={bookmarked ? "secondary" : "outline"}
      size="sm"
      disabled={!session?.user || pending}
      onClick={toggleBookmark}
      className="gap-1.5"
    >
      <BookmarkIcon className={bookmarked ? "fill-current" : ""} />
      {bookmarked ? "Bookmarked" : "Bookmark"}
    </Button>
  );
}

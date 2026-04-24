export interface ThreadableComment {
  id: string;
  parent_comment_id?: string | null;
  created_at: string;
}

export interface CommentThread<T extends ThreadableComment> {
  comment: T;
  replies: T[];
}

function byCreatedAt<T extends ThreadableComment>(left: T, right: T): number {
  return new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
}

export function buildCommentThreads<T extends ThreadableComment>(
  comments: T[]
): Array<CommentThread<T>> {
  const byId = new Map(comments.map((comment) => [comment.id, comment]));
  const repliesByParent = new Map<string, T[]>();
  const roots: T[] = [];

  for (const comment of comments) {
    const parentId = comment.parent_comment_id;
    if (parentId && byId.has(parentId)) {
      const replies = repliesByParent.get(parentId) ?? [];
      replies.push(comment);
      repliesByParent.set(parentId, replies);
      continue;
    }

    roots.push(comment);
  }

  return [...roots].sort(byCreatedAt).map((comment) => ({
    comment,
    replies: [...(repliesByParent.get(comment.id) ?? [])].sort(byCreatedAt),
  }));
}

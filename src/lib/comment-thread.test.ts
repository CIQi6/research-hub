import assert from "node:assert/strict";
import test from "node:test";
import { buildCommentThreads } from "./comment-thread.ts";

test("buildCommentThreads nests one-level replies under their parent comment", () => {
  const threads = buildCommentThreads([
    { id: "root-1", parent_comment_id: null, created_at: "2026-04-24T00:00:00Z" },
    { id: "reply-1", parent_comment_id: "root-1", created_at: "2026-04-24T00:02:00Z" },
    { id: "root-2", parent_comment_id: null, created_at: "2026-04-24T00:01:00Z" },
  ]);

  assert.deepEqual(
    threads.map((thread) => ({
      id: thread.comment.id,
      replies: thread.replies.map((reply) => reply.id),
    })),
    [
      { id: "root-1", replies: ["reply-1"] },
      { id: "root-2", replies: [] },
    ]
  );
});

test("buildCommentThreads treats orphan replies as top-level comments", () => {
  const threads = buildCommentThreads([
    { id: "reply-1", parent_comment_id: "missing", created_at: "2026-04-24T00:02:00Z" },
  ]);

  assert.equal(threads.length, 1);
  assert.equal(threads[0]?.comment.id, "reply-1");
  assert.deepEqual(threads[0]?.replies, []);
});

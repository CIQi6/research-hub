import assert from "node:assert/strict";
import test from "node:test";
import { isMissingTableError } from "./supabase-errors.ts";

test("isMissingTableError detects missing Supabase REST table errors", () => {
  assert.equal(
    isMissingTableError(
      {
        code: "PGRST205",
        message: "Could not find the table 'public.articles' in the schema cache",
      },
      "articles"
    ),
    true
  );
});

test("isMissingTableError ignores unrelated database errors", () => {
  assert.equal(
    isMissingTableError(
      {
        code: "23505",
        message: "duplicate key value violates unique constraint",
      },
      "articles"
    ),
    false
  );
});

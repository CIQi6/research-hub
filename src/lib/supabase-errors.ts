interface SupabaseLikeError {
  code?: string;
  message?: string;
}

export function isMissingTableError(error: unknown, tableName: string): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const { code, message = "" } = error as SupabaseLikeError;
  return (
    code === "PGRST205" ||
    message.includes(`table 'public.${tableName}'`) ||
    message.includes(`relation "public.${tableName}" does not exist`) ||
    message.includes(`relation "${tableName}" does not exist`)
  );
}

export function getMissingTableSetupMessage(tableName: string): string {
  return `数据库还没有 ${tableName} 表，请先在 Supabase SQL Editor 执行最新 supabase-schema.sql。`;
}

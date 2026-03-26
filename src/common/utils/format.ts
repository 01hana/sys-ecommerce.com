export function formatDate(date?: Date | string | null): string | null {
  if (!date) return null;

  const dt = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(dt.getTime())) return null;

  return dt.toISOString().slice(0, 10);
}

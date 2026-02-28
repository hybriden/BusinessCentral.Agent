export function formatToolResponse(entity: Record<string, unknown>, entityType: string): string {
  const lines: string[] = [`--- ${entityType} ---`];
  for (const [key, value] of Object.entries(entity)) {
    if (value !== null && value !== undefined && value !== "") {
      lines.push(`${key}: ${formatValue(value)}`);
    }
  }
  return lines.join("\n");
}

export function formatListResponse(
  rows: Record<string, unknown>[],
  meta?: { mode: string; totalCount: number; returnedCount: number; hasMore: boolean; summary?: string }
): string {
  if (rows.length === 0) return "No records found.";
  const lines: string[] = [];
  if (meta) {
    lines.push(`Showing ${meta.returnedCount} of ${meta.totalCount} records.`);
    if (meta.hasMore) lines.push("Use $filter, $top, or $skip to navigate more data.\n");
    if (meta.summary) lines.push(meta.summary + "\n");
  }
  const keys = Object.keys(rows[0]);
  lines.push(keys.join(" | "));
  lines.push(keys.map(() => "---").join(" | "));
  for (const row of rows) {
    lines.push(keys.map((k) => formatValue(row[k])).join(" | "));
  }
  return lines.join("\n");
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

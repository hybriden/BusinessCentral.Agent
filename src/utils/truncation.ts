export interface TruncationOptions {
  totalCount: number;
  pageSize: number;
  threshold?: number;
  largeThreshold?: number;
  maxStringLength?: number;
}

export interface TruncationMetadata {
  totalCount: number;
  returnedCount: number;
  hasMore: boolean;
  nextPageHint?: string;
}

export interface TruncationResult {
  mode: "full" | "paginated" | "summarized";
  rows: Record<string, unknown>[];
  metadata?: TruncationMetadata;
  summary?: string;
}

export function smartTruncate(
  rows: Record<string, unknown>[],
  options: TruncationOptions
): TruncationResult {
  const threshold = options.threshold ?? 50;
  const largeThreshold = options.largeThreshold ?? 500;
  const maxStringLength = options.maxStringLength ?? 200;

  const truncatedRows = rows.map((row) => truncateStrings(row, maxStringLength));

  if (options.totalCount <= threshold) {
    return { mode: "full", rows: truncatedRows };
  }

  if (options.totalCount <= largeThreshold) {
    const pagedRows = truncatedRows.slice(0, options.pageSize);
    return {
      mode: "paginated",
      rows: pagedRows,
      metadata: {
        totalCount: options.totalCount,
        returnedCount: pagedRows.length,
        hasMore: options.totalCount > pagedRows.length,
        nextPageHint: `Use $skip=${pagedRows.length} to get the next page.`,
      },
    };
  }

  const previewRows = truncatedRows.slice(0, 20);
  const summary = generateSummary(truncatedRows, options.totalCount);
  return {
    mode: "summarized",
    rows: previewRows,
    metadata: {
      totalCount: options.totalCount,
      returnedCount: previewRows.length,
      hasMore: true,
      nextPageHint: "Use $filter to narrow results before fetching more data.",
    },
    summary,
  };
}

function truncateStrings(obj: Record<string, unknown>, maxLength: number): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && value.length > maxLength) {
      result[key] = value.substring(0, maxLength) + "...";
    } else {
      result[key] = value;
    }
  }
  return result;
}

function generateSummary(rows: Record<string, unknown>[], totalCount: number): string {
  const fields = Object.keys(rows[0] || {});
  const lines: string[] = [`Total records: ${totalCount}`, `Fields: ${fields.join(", ")}`];
  for (const field of fields) {
    const values = rows.map((r) => r[field]).filter((v) => typeof v === "string");
    if (values.length > 0) {
      const counts = new Map<string, number>();
      for (const v of values as string[]) {
        counts.set(v, (counts.get(v) || 0) + 1);
      }
      if (counts.size > 1 && counts.size <= 20) {
        const distribution = [...counts.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => `${k}(${v})`)
          .join(", ");
        lines.push(`${field} distribution (sample): ${distribution}`);
      }
    }
  }
  return lines.join("\n");
}

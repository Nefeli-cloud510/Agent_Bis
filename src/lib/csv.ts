export function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (
    text.startsWith("=") ||
    text.startsWith("+") ||
    text.startsWith("-") ||
    text.startsWith("@") ||
    text.startsWith("\t") ||
    text.startsWith("\r")
  ) {
    text = "'" + text;
  }
  if (/[",\r\n]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

export function toCsvWithHeaders(
  rows: Array<Record<string, string | number | boolean | null>>,
  headers: readonly string[]
): string {
  const lines = [headers.map(escapeCsvCell).join(",")];
  for (const row of rows) {
    lines.push(
      headers.map((header) => escapeCsvCell(row[header] ?? "")).join(",")
    );
  }
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}

export function toCsv(
  rows: Array<Record<string, string | number | boolean | null>>
): string {
  if (rows.length === 0) return "";
  return toCsvWithHeaders(rows, Object.keys(rows[0]));
}

import { describe, expect, it } from "vitest";
import { escapeCsvCell, toCsv, toCsvWithHeaders } from "@/lib/csv";

describe("CSV encoding", () => {
  it("adds UTF-8 BOM when writing a table", () => {
    const csv = toCsvWithHeaders([{ a: 1 }], ["a"]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toBe("\uFEFFa\r\n1\r\n");
  });

  it("quotes commas, quotes and newlines", () => {
    const csv = toCsvWithHeaders(
      [{ value: '他说"好",然后\n换行' }],
      ["value"]
    );
    expect(csv).toContain('"他说""好"",然后\n换行"');
  });

  it("escapes spreadsheet formula injection prefixes", () => {
    expect(escapeCsvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(escapeCsvCell("+123")).toBe("'+123");
    expect(escapeCsvCell("-123")).toBe("'-123");
    expect(escapeCsvCell("@cmd")).toBe("'@cmd");
  });

  it("uses first-row headers for plain rows", () => {
    const csv = toCsv([
      { id: 1, name: "张三" },
      { id: 2, name: "李四" },
    ]);
    expect(csv).toContain("id,name");
    expect(csv).toContain("张三");
  });
});

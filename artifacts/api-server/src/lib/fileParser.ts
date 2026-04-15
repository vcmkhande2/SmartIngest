import { logger } from "./logger";

export interface ParsedFileResult {
  headers: string[];
  rows: Record<string, string>[];
  totalRecords: number;
  error?: string;
}

function parseCSV(content: string): ParsedFileResult {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 1) {
    return { headers: [], rows: [], totalRecords: 0, error: "Empty file" };
  }

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row);
  }

  return { headers, rows, totalRecords: rows.length };
}

function parseJSON(content: string): ParsedFileResult {
  try {
    const data = JSON.parse(content);
    const arr = Array.isArray(data) ? data : data.data || data.records || [data];
    if (arr.length === 0) {
      return { headers: [], rows: [], totalRecords: 0 };
    }
    const headers = Object.keys(arr[0]);
    const rows = arr.map((item: Record<string, unknown>) => {
      const row: Record<string, string> = {};
      headers.forEach((h) => {
        row[h] = item[h] != null ? String(item[h]) : "";
      });
      return row;
    });
    return { headers, rows, totalRecords: rows.length };
  } catch {
    return { headers: [], rows: [], totalRecords: 0, error: "Invalid JSON" };
  }
}

function parseTSV(content: string): ParsedFileResult {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 1) {
    return { headers: [], rows: [], totalRecords: 0, error: "Empty file" };
  }
  const headers = lines[0].split("\t").map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.split("\t").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row);
  }
  return { headers, rows, totalRecords: rows.length };
}

export function parseFileContent(fileContent: string, fileType: string, fileName: string): ParsedFileResult {
  let decoded = fileContent;
  if (fileContent.startsWith("data:")) {
    const base64Part = fileContent.split(",")[1];
    if (base64Part) {
      decoded = Buffer.from(base64Part, "base64").toString("utf-8");
    }
  } else if (/^[A-Za-z0-9+/=]{20,}$/.test(fileContent) && !fileContent.includes("\n")) {
    try {
      const attempted = Buffer.from(fileContent, "base64").toString("utf-8");
      if (attempted.includes(",") || attempted.includes("{") || attempted.includes("\t")) {
        decoded = attempted;
      }
    } catch {
    }
  }

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const type = fileType.toLowerCase();

  if (type.includes("json") || ext === "json") {
    return parseJSON(decoded);
  }
  if (type.includes("tab") || ext === "tsv") {
    return parseTSV(decoded);
  }
  return parseCSV(decoded);
}

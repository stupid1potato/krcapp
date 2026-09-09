export type CsvRecord = {
  line: number;
  fields: string[];
};

export type CsvTable = {
  headers: string[];
  rows: { line: number; values: Record<string, string> }[];
};

export function parseCsv(text: string): { records: CsvRecord[] } | { error: string } {
  const src = text.replace(/^\uFEFF/, "");
  const records: CsvRecord[] = [];
  let fields: string[] = [];
  let field = "";
  let inQuotes = false;
  let line = 1;
  let recordLine = 1;

  const pushField = () => {
    fields.push(field);
    field = "";
  };

  const pushRecord = () => {
    const empty = fields.every((cell) => cell.trim() === "");
    if (!empty) records.push({ line: recordLine, fields });
    fields = [];
  };

  for (let i = 0; i < src.length; i++) {
    const char = src[i];
    if (inQuotes) {
      if (char === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        if (char === "\n") line += 1;
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      pushField();
      continue;
    }
    if (char === "\n" || char === "\r") {
      if (char === "\r" && src[i + 1] === "\n") i += 1;
      pushField();
      pushRecord();
      line += 1;
      recordLine = line;
      continue;
    }
    field += char;
  }

  if (inQuotes) {
    return { error: "따옴표가 닫히지 않았습니다." };
  }

  if (field.length > 0 || fields.length > 0) {
    pushField();
    pushRecord();
  }

  if (records.length === 0) {
    return { error: "빈 파일입니다." };
  }

  return { records };
}

export function tableFromRecords(records: CsvRecord[]): CsvTable | { error: string } {
  const headerRecord = records[0];
  if (!headerRecord) return { error: "헤더 행이 없습니다." };

  const headers = headerRecord.fields.map((header) => header.trim().toLowerCase());
  if (headers.some((header) => header === "")) {
    return { error: "비어 있는 열 이름이 있습니다." };
  }

  const seen = new Set<string>();
  for (const header of headers) {
    if (seen.has(header)) return { error: `열 이름이 중복됩니다: ${header}` };
    seen.add(header);
  }

  const rows = records.slice(1).map((record) => {
    const values: Record<string, string> = {};
    headers.forEach((header, index) => {
      values[header] = (record.fields[index] ?? "").trim();
    });
    return { line: record.line, values };
  });

  return { headers, rows };
}

export function parseCsvTable(text: string): CsvTable | { error: string } {
  const parsed = parseCsv(text);
  if ("error" in parsed) return parsed;
  return tableFromRecords(parsed.records);
}

const NAIVE_DATE =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;

function isRealDate(year: number, month: number, day: number, hour: number, minute: number, second: number) {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  if (hour > 23 || minute > 59 || second > 59) return false;
  const utc = Date.UTC(year, month - 1, day, hour, minute, second);
  const probe = new Date(utc);
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day &&
    probe.getUTCHours() === hour &&
    probe.getUTCMinutes() === minute &&
    probe.getUTCSeconds() === second
  );
}

/** Timezone-less `YYYY-MM-DDTHH:mm` values are treated as KST (UTC+9). ISO with offset/Z is kept as-is. */
export function parseImportDateTime(raw: string): Date | null {
  const value = raw.trim();
  if (!value) return null;

  const naive = value.match(NAIVE_DATE);
  if (naive) {
    const year = Number(naive[1]);
    const month = Number(naive[2]);
    const day = Number(naive[3]);
    const hour = Number(naive[4]);
    const minute = Number(naive[5]);
    const second = Number(naive[6] ?? "0");
    if (!isRealDate(year, month, day, hour, minute, second)) return null;
    const stamp = `${naive[1]}-${naive[2]}-${naive[3]}T${naive[4]}:${naive[5]}:${naive[6] ?? "00"}+09:00`;
    const date = new Date(stamp);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (!/Z$|[+-]\d{2}:?\d{2}$/.test(value)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseRequiredInt(raw: string, label: string): { value: number } | { error: string } {
  const value = raw.trim();
  if (!value) return { error: `${label}이(가) 비어 있습니다.` };
  if (!/^-?\d+$/.test(value)) return { error: `${label}은(는) 정수여야 합니다.` };
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) return { error: `${label}이(가) 올바르지 않습니다.` };
  return { value: parsed };
}

export function parseOptionalInt(raw: string, label: string): { value: number | null } | { error: string } {
  if (!raw.trim()) return { value: null };
  return parseRequiredInt(raw, label);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(value: string) {
  return EMAIL_RE.test(value);
}

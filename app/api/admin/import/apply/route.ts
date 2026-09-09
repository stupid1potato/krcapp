import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/authz";
import { applyImport, readCsvUploads } from "@/lib/csv-import";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;

  const uploads = await readCsvUploads(request);
  if ("error" in uploads) {
    return NextResponse.json({ error: uploads.error }, { status: 400 });
  }

  const result = await applyImport(uploads);
  if (!result.ok) {
    if ("preview" in result) {
      return NextResponse.json({ error: "적용할 수 없습니다.", preview: result.preview }, { status: 400 });
    }
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.result);
}

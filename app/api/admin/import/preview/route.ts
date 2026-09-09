import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/authz";
import { previewImport, readCsvUploads } from "@/lib/csv-import";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;

  const uploads = await readCsvUploads(request);
  if ("error" in uploads) {
    return NextResponse.json({ error: uploads.error }, { status: 400 });
  }

  const preview = await previewImport(uploads);
  return NextResponse.json(preview);
}

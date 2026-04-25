import { NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";
import { getSessionFromCookies } from "@/lib/auth";

const TEMPLATE_FILENAME = "UploadTemplate.xlsx";

export async function GET() {
  const session = await getSessionFromCookies();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const filePath = path.join(process.cwd(), "app", "template", TEMPLATE_FILENAME);
    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${TEMPLATE_FILENAME}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Template file not found." }, { status: 404 });
  }
}

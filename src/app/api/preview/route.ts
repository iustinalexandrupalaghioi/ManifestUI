import { NextResponse, type NextRequest } from "next/server";
import { startPreview } from "@/framework/content/server/preview.server";

/** The CMS preview pane's frame: turns on draft mode for this editor and opens the entry's page. */
export async function GET(request: NextRequest) {
  const result = await startPreview(request.nextUrl.searchParams);
  if ("location" in result) return NextResponse.redirect(new URL(result.location, request.url));
  return new NextResponse(result.message, { status: result.status, headers: { "content-type": "text/plain; charset=utf-8" } });
}

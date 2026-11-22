import { NextResponse, type NextRequest } from "next/server";
import { stopPreview } from "@/framework/content/server/preview.server";

/** Leaves preview: draft mode off, back to a page of this site. */
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL(await stopPreview(request.nextUrl.searchParams), request.url));
}

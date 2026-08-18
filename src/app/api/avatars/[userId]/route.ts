import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getCurrentUserId } from "@/framework/authorization/lib/getCurrentUserId";
import { hasServerPermission } from "@/framework/authorization/lib/permissions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { AVATAR_BUCKET } from "@/framework/authentication/lib/resolveAvatarUrl";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  const callerId = await getCurrentUserId();
  if (!callerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (callerId !== userId) {
    const canReadUsers = await hasServerPermission(callerId, "users:read");
    if (!canReadUsers) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const [row] = await db
    .select({ avatar_path: user.avatar_path })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!row?.avatar_path) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await getSupabaseAdmin()
    .storage.from(AVATAR_BUCKET)
    .download(row.avatar_path);

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(data, {
    headers: {
      "Content-Type": data.type || "application/octet-stream",
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}

function sanitizeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() || "avatar";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// Uploads go through the service-role client instead of the browser
// talking to Storage directly with the caller's own session — sidesteps
// depending on a Storage RLS insert policy correctly resolving auth.uid()
// (which this project's Storage session wasn't doing reliably), and keeps
// upload authorization in the same application code as everything else
// here rather than split across Postgres policies and route handlers. A
// user may only ever upload their own avatar, no permission grants this
// to anyone else — unlike the GET above, there's no "users:read" branch.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  const callerId = await getCurrentUserId();
  if (!callerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (callerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const contentType =
    request.headers.get("content-type") ?? "application/octet-stream";
  const filename = sanitizeFileName(
    request.nextUrl.searchParams.get("filename") ?? "avatar",
  );
  const buffer = await request.arrayBuffer();

  if (buffer.byteLength === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }

  const path = `${userId}/${crypto.randomUUID()}-${filename}`;

  const { error: uploadError } = await getSupabaseAdmin()
    .storage.from(AVATAR_BUCKET)
    .upload(path, buffer, { contentType, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  await db
    .update(user)
    .set({ avatar_path: path, updated_at: new Date().toISOString() })
    .where(eq(user.id, userId));

  return NextResponse.json({ path });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  const callerId = await getCurrentUserId();
  if (!callerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (callerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [row] = await db
    .select({ avatar_path: user.avatar_path })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (row?.avatar_path) {
    await getSupabaseAdmin()
      .storage.from(AVATAR_BUCKET)
      .remove([row.avatar_path]);
  }

  await db
    .update(user)
    .set({ avatar_path: null, updated_at: new Date().toISOString() })
    .where(eq(user.id, userId));

  return NextResponse.json({ ok: true });
}

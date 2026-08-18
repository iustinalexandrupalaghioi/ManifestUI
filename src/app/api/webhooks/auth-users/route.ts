import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";

// Shape Supabase Database Webhooks send for INSERT/UPDATE/DELETE triggers.
interface AuthUserRecord {
  id: string;
  email: string | null;
  phone: string | null;
  raw_user_meta_data?: {
    full_name?: string;
    avatar_url?: string;
    picture?: string;
  } | null;
  banned_until: string | null;
  last_sign_in_at: string | null;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: AuthUserRecord | null;
  old_record: AuthUserRecord | null;
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.AUTH_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as WebhookPayload;

  if (payload.type === "DELETE") {
    const id = payload.old_record?.id;
    if (id) {
      await db.delete(user).where(eq(user.id, id));
    }
    return NextResponse.json({ ok: true });
  }

  const record = payload.record;
  if (!record) return NextResponse.json({ ok: true });

  const row = {
    id: record.id,
    email: record.email,
    phone: record.phone,
    full_name: record.raw_user_meta_data?.full_name ?? null,
    avatar_url:
      record.raw_user_meta_data?.avatar_url ??
      record.raw_user_meta_data?.picture ??
      null,
    banned_until: record.banned_until,
    last_sign_in_at: record.last_sign_in_at,
    updated_at: new Date().toISOString(),
  };

  await db
    .insert(user)
    .values(row)
    .onConflictDoUpdate({ target: user.id, set: row });

  return NextResponse.json({ ok: true });
}

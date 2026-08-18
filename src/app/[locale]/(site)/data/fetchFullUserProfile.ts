import "server-only";
import { eq } from "drizzle-orm";
import { getDbClient } from "@/framework/lib/dbClient";
import "@/db";
import { user } from "@/db/schema";

export interface FullUserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  avatar_path: string | null;
}

export async function fetchFullUserProfile(
  userId: string,
): Promise<FullUserProfile | null> {
  const rows = await getDbClient()
    .select({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      avatar_url: user.avatar_url,
      avatar_path: user.avatar_path,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return rows[0] ?? null;
}

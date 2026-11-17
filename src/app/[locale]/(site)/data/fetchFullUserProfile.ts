import "server-only";
import { eq } from "drizzle-orm";
import { getDbClient } from "@/framework/lib/dbClient";
import { user } from "@/db/schema";
import type { FullUserProfile } from "@/framework/authentication/types";

export type { FullUserProfile };

export async function fetchFullUserProfile(
  userId: string,
): Promise<FullUserProfile | null> {
  const rows = await getDbClient()
    .select({
      id: user.id,
      full_name: user.fullName,
      email: user.email,
      phone: user.phone,
      avatar_url: user.avatarUrl,
      avatar_path: user.avatarPath,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return rows[0] ?? null;
}

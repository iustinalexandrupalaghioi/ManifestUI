import "server-only";
import { eq } from "drizzle-orm";
import { getDbClient } from "@/framework/lib/dbClient";
import "@/db";
import { user } from "@/db/schema";

export async function fetchUserProfile(
  userId: string,
): Promise<{
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  avatar_path: string | null;
} | null> {
  const rows = await getDbClient()
    .select({
      full_name: user.fullName,
      email: user.email,
      avatar_url: user.avatarUrl,
      avatar_path: user.avatarPath,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return rows[0] ?? null;
}

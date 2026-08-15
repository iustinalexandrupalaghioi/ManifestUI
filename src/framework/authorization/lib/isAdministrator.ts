import "server-only";
import { eq } from "drizzle-orm";
import { getDbClient } from "@/framework/lib/dbClient";
import "@/db";
import { user } from "@/db/schema";

export async function isAdministrator(userId: string): Promise<boolean> {
  const rows = await getDbClient()
    .select({ administrator: user.administrator })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return rows[0]?.administrator ?? false;
}

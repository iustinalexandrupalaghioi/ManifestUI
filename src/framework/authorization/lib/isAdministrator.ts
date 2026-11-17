import "server-only";
import { eq } from "drizzle-orm";
import { getDbClient } from "@/framework/lib/dbClient";
import { getManifestConfig } from "../../runtime";

export async function isAdministrator(userId: string): Promise<boolean> {
  const { user } = getManifestConfig().authTables;
  const rows = await getDbClient()
    .select({ administrator: user.administrator })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return rows[0]?.administrator ?? false;
}

import { cookies } from "next/headers";
import { createClient } from "./server";

export async function getSupabase() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

import "server-only";
import { cache } from "react";
import { getSupabase } from "@/lib/supabase/getSupabase";

/**
 * The signed-in user's id, verified with the auth server. Asked once per request: layouts,
 * pages and guards calling it again reuse the answer instead of another round trip.
 */
export const getCurrentUserId = cache(async (): Promise<string | null> => {
  const supabase = await getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
});

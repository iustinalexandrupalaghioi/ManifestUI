import "server-only";
import { getSupabase } from "@/lib/supabase/getSupabase";

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

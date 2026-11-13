"use server";

import { getSupabase } from "@/lib/supabase/getSupabase";
import type { ActionResult } from "@/framework/lib/actionResult";

export async function signup(
  fullName: string,
  email: string,
  password: string,
): Promise<ActionResult<null>> {
  const supabase = await getSupabase();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
    },
  });

  if (error) return { ok: false, error: { message: error.message } };
  return { ok: true, data: null };
}

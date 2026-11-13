"use server";

import { getSupabase } from "@/lib/supabase/getSupabase";
import type { ActionResult } from "@/framework/lib/actionResult";

export async function forgotPassword(
  email: string,
): Promise<ActionResult<null>> {
  const supabase = await getSupabase();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // Routes through the code-exchange callback first, per the SSR note above.
    redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback?next=/auth/update-password`,
  });

  if (error) return { ok: false, error: { message: error.message } };
  return { ok: true, data: null };
}

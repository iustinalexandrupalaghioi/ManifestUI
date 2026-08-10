"use server";

import { redirect } from "next/navigation";
import { getSupabase } from "@/lib/supabase/getSupabase";
import type { ActionResult } from "@/framework/lib/actionResult";
import { isSafeRedirect } from "@/framework/authentication/lib/isSafeRedirect";

export async function login(
  email: string,
  password: string,
  next?: string,
): Promise<ActionResult<null> | void> {
  const supabase = await getSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { ok: false, error: { message: error.message } };

  redirect(isSafeRedirect(next) ? next : "/");
}

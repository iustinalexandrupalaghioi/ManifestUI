"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSupabase } from "@/lib/supabase/getSupabase";

export async function logout(): Promise<void> {
  const supabase = await getSupabase();
  await supabase.auth.signOut();
  const locale = await getLocale();
  redirect({ href: "/auth/login", locale });
}

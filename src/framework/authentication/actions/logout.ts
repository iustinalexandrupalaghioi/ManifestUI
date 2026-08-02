"use server";

import { redirect } from "next/navigation";
import { getSupabase } from "@/lib/supabase/getSupabase";

export async function logout(): Promise<void> {
  const supabase = await getSupabase();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

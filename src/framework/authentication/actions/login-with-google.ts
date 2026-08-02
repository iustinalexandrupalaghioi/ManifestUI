"use server";

import { redirect } from "next/navigation";
import { getSupabase } from "@/lib/supabase/getSupabase";

export async function loginWithGoogle(): Promise<void> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
    },
  });

  if (error || !data.url)
    throw new Error(error?.message ?? "Failed to start Google sign-in.");

  redirect(data.url);
}

"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase/getSupabase";
import type { ActionResult } from "@/framework/lib/actionResult";
import { RECOVERY_COOKIE } from "@/framework/authentication/lib/recoveryCookie";

// Require proof the caller actually came through the emailed
// password-recovery link (see auth/callback/route.ts), not just that
// *some* session is currently active. Without this, anyone holding a live
// session — via a stolen cookie, an unlocked device, or XSS elsewhere in
// the app — could silently change the account's password with no
// knowledge of the current one, locking the real owner out.
export async function updatePassword(
  password: string,
): Promise<ActionResult<null> | void> {
  const cookieStore = await cookies();
  const hasRecoveryProof = cookieStore.get(RECOVERY_COOKIE)?.value === "1";
  if (!hasRecoveryProof) {
    return {
      ok: false,
      error: {
        message:
          "This link has expired. Please request a new password reset email.",
      },
    };
  }

  const supabase = await getSupabase();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { ok: false, error: { message: error.message } };

  cookieStore.delete(RECOVERY_COOKIE);
  const locale = await getLocale();
  redirect({ href: "/", locale });
}

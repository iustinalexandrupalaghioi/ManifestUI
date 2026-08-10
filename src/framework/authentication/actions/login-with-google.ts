"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabase } from "@/lib/supabase/getSupabase";
import { isSafeRedirect } from "@/framework/authentication/lib/isSafeRedirect";
import {
  OAUTH_NEXT_COOKIE,
  OAUTH_NEXT_COOKIE_MAX_AGE_SECONDS,
} from "@/framework/authentication/lib/oauthNextCookie";

export async function loginWithGoogle(next?: string): Promise<void> {
  const supabase = await getSupabase();

  // `redirectTo` must stay the exact URL registered in Supabase's allowed
  // Redirect URLs — see oauthNextCookie.ts for why `next` travels via
  // cookie instead of a query param appended here.
  if (isSafeRedirect(next)) {
    const cookieStore = await cookies();
    cookieStore.set(OAUTH_NEXT_COOKIE, next, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: OAUTH_NEXT_COOKIE_MAX_AGE_SECONDS,
      path: "/",
    });
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
    },
  });

  if (error || !data.url)
    throw new Error(error?.message ?? "Failed to start Google sign-in.");

  // Plain `next/navigation` redirect on purpose — `data.url` is an absolute
  // external Google OAuth URL, not an internal app path, so it must bypass
  // next-intl's locale-prefixing redirect.
  redirect(data.url);
}

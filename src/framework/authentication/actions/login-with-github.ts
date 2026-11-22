"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabase } from "@/lib/supabase/getSupabase";
import { isSafeRedirect } from "@/framework/authentication/lib/isSafeRedirect";
import {
  OAUTH_NEXT_COOKIE,
  OAUTH_NEXT_COOKIE_MAX_AGE_SECONDS,
} from "@/framework/authentication/lib/oauthNextCookie";
import { getManifestConfig } from "@/framework/runtime";

export async function loginWithGitHub(next?: string): Promise<void> {
  const supabase = await getSupabase();

  // Same flow as loginWithGoogle: `next` travels via cookie because
  // `redirectTo` must stay the exact URL registered in Supabase.
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
  await getManifestConfig().auth?.beforeOAuthSignIn?.("github");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
    },
  });

  if (error || !data.url)
    throw new Error(error?.message ?? "Failed to start GitHub sign-in.");

  // External GitHub URL, so a plain redirect (not next-intl's locale-aware one).
  redirect(data.url);
}

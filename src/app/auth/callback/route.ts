import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSafeRedirect } from "@/framework/authentication/lib/isSafeRedirect";
import {
  RECOVERY_COOKIE,
  RECOVERY_COOKIE_MAX_AGE_SECONDS,
} from "@/framework/authentication/lib/recoveryCookie";
import { OAUTH_NEXT_COOKIE } from "@/framework/authentication/lib/oauthNextCookie";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();
    const oauthNext = cookieStore.get(OAUTH_NEXT_COOKIE)?.value;
    cookieStore.delete(OAUTH_NEXT_COOKIE);
    const rawNext = oauthNext ?? searchParams.get("next");
    const next = isSafeRedirect(rawNext) ? rawNext : "/";

    const supabase = createClient(cookieStore);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // `redirectType` is set by GoTrueClient whenever this exchange came
      // from a password-recovery link, but @supabase/auth-js's published
      // `AuthTokenResponse` type for this overload doesn't declare it —
      // verified directly against the library's runtime source.
      const redirectType = (data as { redirectType?: string | null })
        .redirectType;
      if (redirectType === "recovery") {
        cookieStore.set(RECOVERY_COOKIE, "1", {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          maxAge: RECOVERY_COOKIE_MAX_AGE_SECONDS,
          path: "/",
        });
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login`);
}

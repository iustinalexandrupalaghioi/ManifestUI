import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { hasLocale } from "next-intl";
import { createClient } from "@/lib/supabase/server";
import { isSafeRedirect } from "@/framework/authentication/lib/isSafeRedirect";
import {
  RECOVERY_COOKIE,
  RECOVERY_COOKIE_MAX_AGE_SECONDS,
} from "@/framework/authentication/lib/recoveryCookie";
import { OAUTH_NEXT_COOKIE } from "@/framework/authentication/lib/oauthNextCookie";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : routing.defaultLocale;
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();
    const oauthNext = cookieStore.get(OAUTH_NEXT_COOKIE)?.value;
    cookieStore.delete(OAUTH_NEXT_COOKIE);
    const rawNext = oauthNext ?? searchParams.get("next");
    // `rawNext` is a canonical (locale-agnostic) pathname, so it needs the
    // locale prefix re-added before it's used in a raw NextResponse.redirect
    // (which, unlike next-intl's own redirect(), does no locale-aware
    // prefixing on its own).
    const next = getPathname({
      href: isSafeRedirect(rawNext) ? rawNext : "/",
      locale,
    });

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

  return NextResponse.redirect(
    `${origin}${getPathname({ href: "/auth/login", locale })}`,
  );
}

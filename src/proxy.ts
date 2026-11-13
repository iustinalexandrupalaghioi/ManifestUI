import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { isSafeRedirect } from "@/framework/authentication/lib/isSafeRedirect";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");
  const response = isApiRoute
    ? NextResponse.next()
    : handleI18nRouting(request);

  if (!isApiRoute && response.headers.get("location")) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value);
          });
        },
      },
    },
  );

  // Do not add code between createServerClient and getUser() - it refreshes
  // the token and must run on every request for the cookie sync above to work.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  const localeMatch = pathname.match(
    new RegExp(`^/(${routing.locales.join("|")})(?=/|$)`),
  );
  const localePrefix = localeMatch ? localeMatch[0] : "";
  const pathWithoutLocale = localeMatch
    ? pathname.slice(localePrefix.length) || "/"
    : pathname;
  const requiresAuth =
    pathWithoutLocale.startsWith("/cms") ||
    pathWithoutLocale.startsWith("/profile");

  if (requiresAuth && !user) {
    const next = `${pathWithoutLocale}${search}`;
    const loginUrl = new URL(`${localePrefix}/auth/login`, request.url);
    if (isSafeRedirect(next)) loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // /api/webhooks/* is excluded — those are server-to-server calls (e.g.
    // Supabase Database Webhooks) with no browser session to refresh.
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

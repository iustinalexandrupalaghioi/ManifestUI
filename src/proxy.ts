import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSafeRedirect } from "@/framework/authentication/lib/isSafeRedirect";

// Keeps the Supabase session cookie fresh on every request. Per @supabase/ssr's
// own docs this is mandatory for SSR: without it, a page rendered on the server
// can read an expired access token (e.g. a tab reopened after being idle) since
// only this proxy - not Server Components - is allowed to refresh and re-set it.
//
// The real, per-page authorization boundary is `ResourceGuard` and the
// `withPermission` wrapper on each resource's server actions (see
// src/framework/authorization/rbac.ts) — not this file. Per Next's own
// guidance, `proxy`/middleware should only do *optimistic* checks (fast,
// no DB round trip), so the redirect below is a defense-in-depth fallback
// for the case where a page under an authenticated route forgets to add
// `ResourceGuard` — it is not a substitute for that check.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
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
  const isPublicRoute =
    pathname.startsWith("/auth/") || pathname.startsWith("/api/");

  if (!user && !isPublicRoute) {
    const next = `${pathname}${search}`;
    const loginUrl = new URL("/auth/login", request.url);
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

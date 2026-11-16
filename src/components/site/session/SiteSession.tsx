"use client";

/**
 * The signed-in visitor on the public site, loaded in the browser so the
 * pages themselves can be static and identical for everyone. Refetched when
 * the address changes (login and logout redirect) and on the
 * "manifestui:auth-changed" event (profile or avatar saved). The last value is
 * remembered in this browser, so returning users don't see the signed-out
 * navbar flash first.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";
import { AUTH_CHANGED_EVENT } from "@/framework/authentication/lib/authEvents";
import { getSiteSession, type SiteSession } from "./actions";
const STORAGE_KEY = "manifestui:site-session";

/** `undefined` while unknown (first visit, not loaded yet), `null` for visitors. */
const SessionContext = createContext<SiteSession | null | undefined>(undefined);

function remembered(): SiteSession | null | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SiteSession) : undefined;
  } catch {
    return undefined;
  }
}

function remember(session: SiteSession | null) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: the navbar just updates once the session loads.
  }
}

/** Supabase's session cookie (`sb-<project>-auth-token`, possibly split into `.0`, `.1`…); readable by scripts. */
const hasAuthCookie = () => /(?:^|;\s*)sb-[^=;]+-auth-token(?:\.\d+)?=/.test(document.cookie);

export function SiteSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SiteSession | null | undefined>(undefined);
  const pathname = usePathname();
  const [version, setVersion] = useState(0);

  // The remembered value, after hydration (the static HTML is the signed-out state).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession((current) => (current === undefined ? remembered() : current));
  }, []);

  useEffect(() => {
    const onChange = () => setVersion((n) => n + 1);
    window.addEventListener(AUTH_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onChange);
  }, []);

  useEffect(() => {
    // Visitors who never signed in have no Supabase auth cookie: no need to ask the server.
    if (!hasAuthCookie()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSession(null);
      remember(null);
      return;
    }
    let cancelled = false;
    getSiteSession()
      .then((next) => {
        if (cancelled) return;
        setSession(next);
        remember(next);
      })
      .catch(() => {
        // Offline or server error: keep what we have.
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, version]);

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

/** The signed-in visitor; `undefined` while unknown, `null` when signed out. */
export function useSiteSession() {
  return useContext(SessionContext);
}

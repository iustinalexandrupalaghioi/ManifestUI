import type { ReactNode } from "react";
import { SiteFooterSlot } from "./SiteFooterSlot";

/**
 * The frame around the account screens (login, sign-up, password reset, the
 * profile): the site's surface band with a soft teal glow, the card centred in
 * it, and the site footer. The cards themselves are the framework's AuthCard.
 *
 * Reads nothing from the request, so pages using it stay static where they can.
 */
export function AccountFrame({ children }: { children: ReactNode }) {
  return (
    <>
      <main className="relative isolate flex min-h-[calc(100svh-4rem)] items-center overflow-hidden border-b bg-surface px-4 py-12 sm:px-6 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_oklch,var(--primary)_16%,transparent),transparent)]"
        />
        <div className="w-full">{children}</div>
      </main>
      <SiteFooterSlot />
    </>
  );
}

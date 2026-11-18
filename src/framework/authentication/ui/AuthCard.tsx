import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The shell every auth screen shares (login, sign-up, password reset, the
 * confirmation screens): a heading, the form in a card, and a line under the
 * card for the "No account? Sign up" style link. Styled only with theme tokens,
 * so it follows the site's palette, fonts and dark mode. The page around it
 * (background, centring, header and footer) belongs to the app's auth layout.
 *
 * No "use client": the forms use it on the client, confirmation pages on the server.
 */
export function AuthCard({
  title,
  description,
  leading,
  actions,
  footer,
  className,
  children,
  ...props
}: Omit<ComponentPropsWithoutRef<"div">, "title"> & {
  title: ReactNode;
  description?: ReactNode;
  /** Before the title, e.g. the profile's avatar. */
  leading?: ReactNode;
  /** At the end of the heading row, e.g. a settings menu. */
  actions?: ReactNode;
  /** Shown under the card, e.g. a link to the other auth screen. */
  footer?: ReactNode;
}) {
  return (
    <div
      className={cn("mx-auto flex w-full max-w-md flex-col gap-6", className)}
      {...props}
    >
      <div
        className={cn(
          "rounded-2xl border bg-card p-6 text-card-foreground shadow-xl shadow-black/5 sm:p-8 dark:shadow-black/30",
          fields,
        )}
      >
        <header
          className={cn(
            "flex flex-wrap items-center gap-4",
            children ? "mb-7" : undefined,
          )}
        >
          {leading}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h1 className="m-0 font-heading text-[28px] leading-tight font-semibold tracking-tight text-balance wrap-break-word">
              {title}
            </h1>
            {description && (
              <div className="m-0 text-base leading-relaxed text-muted-foreground">
                {description}
              </div>
            )}
          </div>
          {actions}
        </header>
        {children}
      </div>
      {footer && (
        <div className="text-center text-sm text-muted-foreground">
          {footer}
        </div>
      )}
    </div>
  );
}

/** Inputs sized to the buttons (the form fields are shared with the CMS, where they stay compact). */
const fields =
  "[&_[data-slot=input]]:h-11 [&_[data-slot=input]]:rounded-xl [&_[data-slot=input]]:px-3.5 [&_[data-slot=input-group]]:h-11 [&_[data-slot=input-group]]:rounded-xl";

/** The main action: large and rounded like the site's calls to action. */
export const authPrimaryButton =
  "h-12 w-full rounded-xl text-base font-semibold";
/** Google, GitHub and other secondary actions. */
export const authSecondaryButton =
  "h-12 w-full rounded-xl bg-card text-base font-semibold hover:bg-muted";
/** Links inside and under the card ("Forgot password?", "Sign up"). */
export const authLink =
  "rounded-sm font-semibold text-primary underline-offset-4 hover:underline";

/** "or" between the main action and the social sign-in buttons. */
export function AuthDivider({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {children}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

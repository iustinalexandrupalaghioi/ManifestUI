import "server-only";
import { ZodError } from "zod";
import { getLocale, getTranslations } from "next-intl/server";
import { mapCaughtError } from "@/framework/lib/mapPgError";
import { DescribedActionError, type ActionResult } from "@/framework/lib/actionResult";
import { requirePermission } from "./requirePermission";
import { ForbiddenError } from "./ForbiddenError";

// Server Actions that throw have their error message stripped in
// production — Next.js only forwards a `digest` across that boundary, so
// any thrown error (a permission check, a unique-constraint violation, a
// not-found) reaches the client as an opaque "something went wrong"
// message with no way to recover it. `withPermission` catches everything
// here and returns it as normal data instead, per Next's own guidance for
// expected errors (see node_modules/next/dist/docs/.../error-handling.md,
// "avoid throwing... model expected errors as return values").
export function withPermission<Args extends unknown[], R>(
  resourceId: string,
  action: string | string[],
  fn: (...args: Args) => Promise<R>,
): (...args: Args) => Promise<ActionResult<R>> {
  const actionLabel = Array.isArray(action) ? action.join("|") : action;
  return async (...args: Args) => {
    try {
      await requirePermission(resourceId, action);
      const data = await fn(...args);
      return { ok: true, data };
    } catch (err) {
      console.error(`[${resourceId}:${actionLabel}]`, err);

      const locale = await getLocale();

      if (err instanceof ForbiddenError) {
        const t = await getTranslations({ locale, namespace: "Errors" });
        return {
          ok: false,
          error: {
            message: t("forbidden"),
            originalMessage: err.message,
            meta: { type: "forbidden" },
          },
        };
      }

      if (err instanceof DescribedActionError) {
        return { ok: false, error: err.error };
      }

      if (err instanceof ZodError) {
        const t = await getTranslations({ locale, namespace: "Errors" });
        return {
          ok: false,
          error: {
            message: t("invalidInput"),
            meta: {
              type: "validation",
              issues: err.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
              })),
            },
          },
        };
      }

      return { ok: false, error: mapCaughtError(err, locale) };
    }
  };
}

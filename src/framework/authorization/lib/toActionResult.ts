import "server-only";
import { ZodError } from "zod";
import { getLocale, getTranslations } from "next-intl/server";
import { mapCaughtError } from "@/framework/lib/mapPgError";
import { DescribedActionError, type ActionError, type ActionResult } from "@/framework/lib/actionResult";
import { ForbiddenError } from "./ForbiddenError";

// Server Actions that throw have their error message stripped in
// production — Next.js only forwards a `digest` across that boundary, so
// any thrown error (a permission check, a unique-constraint violation, a
// not-found) reaches the client as an opaque "something went wrong"
// message with no way to recover it. This catches everything and returns
// it as normal data instead, per Next's own guidance for expected errors
// (see node_modules/next/dist/docs/.../error-handling.md, "avoid
// throwing... model expected errors as return values").
//
// `describe` lets a caller turn its own error classes into messages first.
export async function toActionResult<R>(
  label: string,
  run: () => Promise<R>,
  describe?: (err: unknown, locale: string) => Promise<ActionError | null>,
): Promise<ActionResult<R>> {
  try {
    return { ok: true, data: await run() };
  } catch (err) {
    console.error(`[${label}]`, err);

    const locale = await getLocale();

    if (err instanceof ForbiddenError) {
      const t = await getTranslations({ locale, namespace: "Errors" });
      return {
        ok: false,
        error: { message: t("forbidden"), originalMessage: err.message, meta: { type: "forbidden" } },
      };
    }

    if (err instanceof DescribedActionError) return { ok: false, error: err.error };

    if (err instanceof ZodError) {
      const t = await getTranslations({ locale, namespace: "Errors" });
      return {
        ok: false,
        error: {
          message: t("invalidInput"),
          meta: {
            type: "validation",
            issues: err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
          },
        },
      };
    }

    const described = describe ? await describe(err, locale) : null;
    if (described) return { ok: false, error: described };

    return { ok: false, error: mapCaughtError(err, locale) };
  }
}

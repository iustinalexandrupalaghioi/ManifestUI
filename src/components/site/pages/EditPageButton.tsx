"use client";

import { useTranslations } from "next-intl";
import { PencilIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { BASE_ROUTE } from "@/components/cms/constants";
import { useSiteSession } from "../internal/session/SiteSession";

/**
 * "Edit this page" for people who may edit it: opens the page (or service) in
 * the CMS editor. Shown from the browser session, so the static page stays
 * the same for everyone.
 */
export function EditPageButton({ kind, id }: { kind: "page" | "service"; id: number }) {
  const session = useSiteSession();
  const t = useTranslations("Landing.pages");
  if (!session?.canEdit[kind]) return null;
  const href = `${BASE_ROUTE}/${kind === "page" ? "site-pages" : "services"}/${id}`;
  return (
    <Link
      href={href}
      className="fixed right-4 bottom-4 z-50 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground no-underline shadow-[0_10px_30px_rgba(4,35,44,0.45)] hover:bg-primary/90"
    >
      <PencilIcon className="size-4" aria-hidden />
      {kind === "page" ? t("editPage") : t("editService")}
    </Link>
  );
}

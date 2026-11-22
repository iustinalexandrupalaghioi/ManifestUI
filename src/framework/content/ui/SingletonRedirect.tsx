import { getTranslations } from "next-intl/server";
import { singletonRowId } from "../server/index.server";

/**
 * A singleton's CMS route: opens its row in the CMS's language. There's no
 * list, Add or Delete for a single entry. `redirectTo` is the app's
 * locale-aware redirect (it's called with the row's detail route).
 */
export async function SingletonRedirect({
  type,
  locale,
  detailRoute,
  redirectTo,
}: {
  type: string;
  locale: string;
  detailRoute: (rowId: string) => string;
  redirectTo: (href: string) => never;
}) {
  const rowId = await singletonRowId(type, locale);
  if (rowId) redirectTo(detailRoute(rowId));
  const t = await getTranslations("Content");
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-2 p-8">
      <h1 className="m-0 text-lg font-semibold">{t("singletonMissingTitle")}</h1>
      <p className="m-0 text-sm text-muted-foreground">{t("singletonMissingBody")}</p>
    </main>
  );
}

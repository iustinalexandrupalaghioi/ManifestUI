import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "./locales";

const NAMESPACES = [
  { group: "framework", name: "Common" },
  { group: "framework", name: "Errors" },
  { group: "framework", name: "AccessDenied" },
  { group: "framework", name: "ErrorDialog" },
  { group: "framework", name: "BulkResult" },
  { group: "framework", name: "Dialog" },
  { group: "framework", name: "DataView" },
  { group: "framework", name: "Filtering" },
  { group: "framework", name: "Views" },
  { group: "framework", name: "Pagination" },
  { group: "framework", name: "Toast" },
  { group: "framework", name: "Resource" },
  { group: "framework", name: "Auth" },
  { group: "framework", name: "AuthForms" },
  { group: "framework", name: "Files" },
  { group: "framework", name: "Validation" },
  { group: "framework", name: "ColumnManager" },
  { group: "framework", name: "ContextMenu" },
  { group: "framework", name: "DataTable" },
  { group: "framework", name: "Toolbar" },
  { group: "framework", name: "Calendar" },
  { group: "features", name: "Menu" },
  { group: "features", name: "Todos" },
  { group: "features", name: "RolePermissions" },
] as const;

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const requested = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(requested) ? requested : DEFAULT_LOCALE;

  const modules = await Promise.all(
    NAMESPACES.map(
      ({ group, name }) =>
        import(`../../messages/${locale}/${group}/${name}.json`),
    ),
  );

  const messages = Object.fromEntries(
    NAMESPACES.map(({ name }, i) => [name, modules[i].default]),
  );

  return { locale, messages };
});

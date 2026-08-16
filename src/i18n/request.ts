import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

const NAMESPACES = [
  { group: "framework", name: "Common" },
  { group: "framework", name: "Errors" },
  { group: "framework", name: "AccessDenied" },
  { group: "framework", name: "ErrorDialog" },
  { group: "framework", name: "BulkResult" },
  { group: "framework", name: "Dialog" },
  { group: "framework", name: "DataView" },
  { group: "framework", name: "Filtering" },
  { group: "framework", name: "Sorting" },
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
  { group: "framework", name: "Editing" },
  { group: "features", name: "Menu" },
  { group: "features", name: "Todos" },
  { group: "features", name: "GroupPermissions" },
  { group: "site", name: "Site" },
] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

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

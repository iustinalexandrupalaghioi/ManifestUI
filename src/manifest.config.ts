import "server-only";

import { defineManifestConfig } from "@/framework/config";
import { db } from "@/db";
import { group, groupPermission, user, userGroup } from "@/db/schema";
import { resourceDescriptors } from "@/app/[locale]/cms/resourceDescriptors";

/**
 * The project's composition root: everything the framework needs from this
 * project, in one place. The framework reads it through
 * src/framework/runtime.ts and never imports project code directly.
 */
const authTables = { user, group, groupPermission, userGroup };

declare module "@/framework/config" {
  interface Register {
    authTables: typeof authTables;
  }
}

export default defineManifestConfig({
  db,
  resources: resourceDescriptors,
  authTables,
});

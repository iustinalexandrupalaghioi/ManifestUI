import "server-only";

import config from "@/manifest.config";
import type { ManifestConfig } from "./config";

/**
 * The project's config, for the framework's server code. This is the only
 * framework file that imports from the project (checked by
 * scripts/check-boundaries.mjs). Read it inside functions, not at module
 * load, so imports between the config and the framework can't cycle.
 */
export function getManifestConfig(): ManifestConfig {
  return config;
}

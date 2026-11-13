import type { DataViewFeature } from "../contracts";
import {
  DEFAULT_FEATURES,
  FEATURE_CATALOG,
  FEATURE_CATALOG_ORDER,
  type DataViewFeaturesConfig,
} from "./catalog";

export function resolveFeatures(
  map?: DataViewFeaturesConfig,
): DataViewFeature[] {
  if (!map) return DEFAULT_FEATURES;
  return FEATURE_CATALOG_ORDER.filter((id) => map[id] !== false).map(
    (id) => FEATURE_CATALOG[id],
  );
}

"use client";

import { useLayoutRenderContext } from "./LayoutContext";
import { usePickupRecord } from "../../form-fields/FormFieldWithPickup";
import { DisplayFieldRenderer } from "../DisplayFieldRenderer";
import { resolveDisplayValue } from "../../lib/pickupDisplayField";
import type { PickupValueNode } from "../../types/layout-types";

/**
 * Read-only value of the record chosen through a `pickup` field, placed
 * anywhere in a free layout. Looks the pickup up by the target field's name.
 */
export function PickupValue({ node }: { node: PickupValueNode }) {
  const { item, pickups } = useLayoutRenderContext();
  const pickup = pickups?.[node.target];

  // Hooks can't be conditional, so fall back to an inert config when the
  // target is missing (the dev validator reports that case).
  const { selectedRecord } = usePickupRecord(
    pickup?.targetField ?? node.target,
    pickup?.resource ?? "",
    pickup?.mapField ?? "id",
    pickup?.embeddedField,
    item,
  );

  if (!pickup) return null;

  return (
    <DisplayFieldRenderer
      field={{
        from: node.from,
        label: node.label,
        type: node.displayType,
        options: node.options,
        maxRows: node.maxRows,
      }}
      value={resolveDisplayValue({ from: node.from }, selectedRecord)}
    />
  );
}

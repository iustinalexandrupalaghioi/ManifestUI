import type {
  FormConfig,
  FieldConfig,
  PickupConfig,
} from "@/framework/components/form/types/types";
import { collectFormFields } from "@/framework/components/form/lib/walkLayout";

function hasPickup(
  field: FieldConfig<any>,
): field is FieldConfig<any> & { pickup: PickupConfig<any> } {
  return "pickup" in field && field.pickup !== undefined;
}

export function findPickupField(
  formConfig: FormConfig<any>,
  origin: string,
): string | undefined {
  for (const field of collectFormFields(formConfig)) {
    if (hasPickup(field) && field.pickup.resource === origin) {
      return field.pickup.targetField;
    }
  }
  return undefined;
}

export function preFilterToFormKey(
  f: { origin?: string; columnName: string },
  formConfig?: FormConfig<any>,
): string {
  if (!f.origin || !formConfig) return f.columnName;
  return findPickupField(formConfig, f.origin) ?? f.columnName;
}

import type {
  FormConfig,
  SectionConfig,
  FieldSectionConfig,
  FieldConfig,
  PickupConfig,
} from "@/framework/components/form/types/types";

function isFieldSection(
  section: SectionConfig<any>,
): section is FieldSectionConfig<any> {
  return section.type === undefined || section.type === "fields";
}

function hasPickup(
  field: FieldConfig<any>,
): field is FieldConfig<any> & { pickup: PickupConfig<any> } {
  return "pickup" in field && field.pickup !== undefined;
}

export function findPickupField(
  formConfig: FormConfig<any>,
  origin: string,
): string | undefined {
  const { layout } = formConfig;

  const sections =
    layout.mode === "grid"
      ? layout.columns.flatMap((column) => column.sections)
      : layout.sections;

  for (const section of sections) {
    if (!isFieldSection(section)) continue;
    for (const field of section.fields) {
      if (hasPickup(field) && field.pickup.resource === origin) {
        return field.pickup.targetField;
      }
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

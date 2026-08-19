import type {
  FieldConfig,
  FormConfig,
  PickupFillField,
  SectionConfig,
} from "../types/types";

export interface PickupFillFieldMatch<TFormValues> {
  owningField: FieldConfig<TFormValues>;
  fillField: PickupFillField;
}

export interface FlattenedFormFields<TFormValues> {
  directFields: Map<string, FieldConfig<TFormValues>>;
  pickupFillFields: Map<string, PickupFillFieldMatch<TFormValues>>;
}

export function getPickupConfig<TFormValues>(field: FieldConfig<TFormValues>) {
  return "pickup" in field ? field.pickup : undefined;
}

function collectFromSections<TFormValues>(
  sections: SectionConfig<TFormValues>[],
  directFields: Map<string, FieldConfig<TFormValues>>,
  pickupFillFields: Map<string, PickupFillFieldMatch<TFormValues>>,
) {
  for (const section of sections) {
    if (section.type === "slot") continue;

    // A custom section's own render() is opaque to us — it only exposes
    // fields at all if it declares them via `fields` (see CustomSectionConfig).
    const fields =
      section.type === "custom" ? (section.fields ?? []) : section.fields;

    for (const field of fields) {
      directFields.set(field.name, field);

      const pickup = "pickup" in field ? field.pickup : undefined;
      pickup?.fillFields?.forEach((fillField) => {
        pickupFillFields.set(fillField.from, { owningField: field, fillField });
      });
    }
  }
}

/**
 * Flattens a resource's FormConfig (fields live nested inside
 * layout.sections[].fields[] for "stack" mode, or
 * layout.columns[].sections[].fields[] for "grid" mode) into two lookup
 * maps used to resolve which form field, if any, a grid column should be
 * edited through — see createOverview's `editableField` column meta.
 */
export function flattenFormFields<TFormValues>(
  formConfig: FormConfig<TFormValues> | undefined,
  extraSections?: SectionConfig<TFormValues>[][],
): FlattenedFormFields<TFormValues> {
  const directFields = new Map<string, FieldConfig<TFormValues>>();
  const pickupFillFields = new Map<string, PickupFillFieldMatch<TFormValues>>();

  if (formConfig) {
    if (formConfig.layout.mode === "stack") {
      collectFromSections(
        formConfig.layout.sections,
        directFields,
        pickupFillFields,
      );
    } else {
      for (const column of formConfig.layout.columns) {
        collectFromSections(column.sections, directFields, pickupFillFields);
      }
    }
  }

  extraSections?.forEach((sections) =>
    collectFromSections(sections, directFields, pickupFillFields),
  );

  return { directFields, pickupFillFields };
}

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
  /** Form field, keyed by its own `name` — e.g. "title", "completed", "user_id". */
  directFields: Map<string, FieldConfig<TFormValues>>;
  /** Owning pickup field, keyed by each `fillFields[].from` it fills — e.g. "username" -> user_id's field. */
  pickupFillFields: Map<string, PickupFillFieldMatch<TFormValues>>;
}

/** Not every FieldConfig variant statically carries `pickup` (e.g. file fields don't) — narrow safely. */
export function getPickupConfig<TFormValues>(field: FieldConfig<TFormValues>) {
  return "pickup" in field ? field.pickup : undefined;
}

function collectFromSections<TFormValues>(
  sections: SectionConfig<TFormValues>[],
  directFields: Map<string, FieldConfig<TFormValues>>,
  pickupFillFields: Map<string, PickupFillFieldMatch<TFormValues>>,
) {
  for (const section of sections) {
    if (section.type === "slot" || section.type === "custom") continue;

    for (const field of section.fields) {
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
): FlattenedFormFields<TFormValues> {
  const directFields = new Map<string, FieldConfig<TFormValues>>();
  const pickupFillFields = new Map<string, PickupFillFieldMatch<TFormValues>>();

  if (!formConfig) return { directFields, pickupFillFields };

  if (formConfig.layout.mode === "stack") {
    collectFromSections(formConfig.layout.sections, directFields, pickupFillFields);
  } else {
    for (const column of formConfig.layout.columns) {
      collectFromSections(column.sections, directFields, pickupFillFields);
    }
  }

  return { directFields, pickupFillFields };
}

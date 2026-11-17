import { createEnum } from "@/framework/lib/utils";

/** Values allowed by the `relation_gender_check` constraint on `relation.gender`. */
export const Gender = createEnum({
  male: { en: "Male", ro: "Masculin" },
  female: { en: "Female", ro: "Feminin" },
  other: { en: "Other", ro: "Altul" },
});

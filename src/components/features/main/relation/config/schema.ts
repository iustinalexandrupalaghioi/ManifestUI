import { z } from "zod";
import type { Relation } from "@/app/types/main/Relation";
import { Gender } from "@/app/types/main/Relation";

export const relationSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  maiden_name: z.string().trim(),
  age: z.coerce.number().min(0, "Age must be a positive number"),
  height: z.coerce.number().min(0),
  weight: z.coerce.number().min(0),
  gender: z.enum(Gender.values),
  email: z.email("Email is invalid").trim(),
  phone: z.string().trim().min(7, "Phone is required"),
  username: z.string().trim().min(1, "Username is required"),
  birth_date: z.string().trim().min(1, "Birth date is required"),
  image: z.string().optional(),
  blood_group: z.string().trim().min(1, "Blood group is required"),
  eye_color: z.string().trim().min(1, "Eye color is required"),
  hair_color: z.string().trim().min(1, "Hair color is required"),
  hair_type: z.string().trim().min(1, "Hair type is required"),
}) satisfies z.ZodType<Omit<Relation, "id" | "created_at">, any, any>;

export type RelationFormValues = z.infer<typeof relationSchema>;

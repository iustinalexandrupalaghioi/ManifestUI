import { createEnum } from "@/framework/lib/utils"

export type Relation = {
  id: number
  first_name: string
  last_name: string
  maiden_name: string
  age: number
  gender: Gender
  email: string
  password: string
  phone: string
  username: string
  birth_date: string
  image?: string
  blood_group: string
  height: number
  weight: number
  eye_color: string
  hair_color: string
  hair_type: string
  created_at: string
}

export const Gender = createEnum({
  male: { en: "Male", ro: "Masculin" },
  female: { en: "Female", ro: "Feminin" },
  other: { en: "Other", ro: "Altul" },
})

export type Gender = keyof typeof Gender.labels

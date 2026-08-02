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
  male: "Male",
  female: "Female",
  other: "Other",
})

export type Gender = keyof typeof Gender.labels

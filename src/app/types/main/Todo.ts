import type { Relation } from "./Relation"

export type Todo = {
  id: number
  title: string
  completed: boolean | null
  created_at: string
  user_id: number
  relation?: Pick<Relation, "id" | "username" | "first_name" | "last_name" | "email" | "gender" | "age"> | null
  notes: string
}

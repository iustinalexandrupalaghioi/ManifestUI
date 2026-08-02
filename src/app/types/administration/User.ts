export interface User {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  administrator: boolean
  banned_until: string | null
  created_at: string | null
  updated_at: string | null
}

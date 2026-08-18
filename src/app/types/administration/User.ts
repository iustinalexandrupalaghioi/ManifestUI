export interface User {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
  avatar_path: string | null
  administrator: boolean
  banned_until: string | null
  last_sign_in_at: string | null
  created_at: string | null
  updated_at: string | null
}

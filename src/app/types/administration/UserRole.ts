export interface UserRole {
  id: string;
  user_id: string;
  role_id: number;
  created_at: string | null;
  role?: { id: number; name: string };
  user?: { id: string; email: string | null; full_name: string | null };
}

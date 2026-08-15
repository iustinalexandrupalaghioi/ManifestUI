export interface UserGroup {
  id: string;
  user_id: string;
  group_id: number;
  created_at: string | null;
  group?: { id: number; name: string };
  user?: { id: string; email: string | null; full_name: string | null };
}

/** A signed-in user's own profile, as the profile form edits it. */
export interface FullUserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  avatar_path: string | null;
}

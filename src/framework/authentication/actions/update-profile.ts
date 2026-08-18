"use server";

import { eq } from "drizzle-orm";
import { getSupabase } from "@/lib/supabase/getSupabase";
import { db } from "@/db";
import { user } from "@/db/schema";
import type { ActionResult } from "@/framework/lib/actionResult";

interface UpdateProfileInput {
  full_name: string;
  email: string;
  phone: string | null;
}

interface UpdateProfileResult {
  emailChangePending: boolean;
}

export async function updateProfile(
  input: UpdateProfileInput,
): Promise<ActionResult<UpdateProfileResult>> {
  const supabase = await getSupabase();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    return { ok: false, error: { message: "Not authenticated" } };
  }

  const emailChangePending = input.email !== currentUser.email;

  const { error } = await supabase.auth.updateUser({
    email: input.email,
    phone: input.phone ?? undefined,
    data: { full_name: input.full_name },
  });

  if (error) return { ok: false, error: { message: error.message } };

  await db
    .update(user)
    .set({
      full_name: input.full_name,
      phone: input.phone,
      ...(emailChangePending ? {} : { email: input.email }),
      updated_at: new Date().toISOString(),
    })
    .where(eq(user.id, currentUser.id));

  return { ok: true, data: { emailChangePending } };
}

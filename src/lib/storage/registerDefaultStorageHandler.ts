"use client";

// Side-effect module — import it (for its side effect only) from any client
// boundary that needs file uploads before the first user interaction that
// triggers one. `setStorageHandler` is a module-level singleton, so this is
// safe to import from multiple entry points (cms/providers.tsx and the
// (site) profile form both need it) — later imports are no-ops.
import { setStorageHandler } from "@/framework/components/files/storage/handler";
import { createSupabaseHandler } from "./createSupabaseHandler";

setStorageHandler(
  createSupabaseHandler({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  }),
);

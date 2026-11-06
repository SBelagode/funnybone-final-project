"use server";

import { createClient } from "@/utils/supabase/server";

export async function checkAuthStatusAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    isAuthenticated: Boolean(user),
    isAnonymous: Boolean(user?.app_metadata?.provider === "anonymous" || user?.is_anonymous),
    userId: user?.id ?? null,
  };
}



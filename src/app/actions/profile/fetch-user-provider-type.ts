"use server";

import { createClient } from "@/utils/supabase/server";

export const fetchUserProviderTypeAction = async () => {
  const supabase = await createClient();

  // Get the current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not found.");
  }

  // Return the user's email
  return user.app_metadata.provider;
};

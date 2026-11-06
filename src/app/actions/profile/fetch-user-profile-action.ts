"use server";

import { createClient } from "@/utils/supabase/server";

export const fetchUserProfileAction = async () => {
  const supabase = await createClient();

  // Get the current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not found.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, created_datetime_utc, modified_datetime_utc")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error.message);
    throw new Error("Failed to fetch profile.");
  }

  return data;
};

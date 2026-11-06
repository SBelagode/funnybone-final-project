"use server";

import { createClient } from "@/utils/supabase/server";

export const fetchUserDormAction = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not found.");
  }

  const { data, error } = await supabase
    .from("profile_dorm_mappings")
    .select("dorm_id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching user dorm:", error.message);
    throw new Error("Failed to fetch user dorm.");
  }

  return data?.dorm_id || null;
};

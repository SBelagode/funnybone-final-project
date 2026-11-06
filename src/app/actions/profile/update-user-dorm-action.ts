"use server";

import { createClient } from "@/utils/supabase/server";

export const updateUserDormAction = async (dormId: string | null) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not found.");
  }

  // If dormId is null, delete the mapping
  if (!dormId) {
    const { error } = await supabase
      .from("profile_dorm_mappings")
      .delete()
      .eq("profile_id", user.id);

    if (error) {
      console.error("Error deleting dorm mapping:", error.message);
      throw new Error("Failed to delete dorm mapping.");
    }

    return null;
  }

  const { data: existingMapping } = await supabase
    .from("profile_dorm_mappings")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (existingMapping) {
    const timestamp = new Date().toISOString();
    const { data, error } = await supabase
      .from("profile_dorm_mappings")
      .update({
        dorm_id: dormId,
        updated_at: timestamp,
        modified_by_user_id: user.id,
      })
      .eq("profile_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating dorm mapping:", error.message);
      throw new Error("Failed to update dorm mapping.");
    }

    return data;
  } else {
    // Insert new mapping
    const timestamp = new Date().toISOString();
    const { data, error } = await supabase
      .from("profile_dorm_mappings")
      .insert({
        profile_id: user.id,
        dorm_id: dormId,
        created_at: timestamp,
        updated_at: timestamp,
        created_by_user_id: user.id,
        modified_by_user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting dorm mapping:", error.message);
      throw new Error("Failed to insert dorm mapping.");
    }

    return data;
  }
};

"use server";

import { createClient } from "@/utils/supabase/server";

export const updateUserProfileAction = async (
  firstName: string,
  lastName: string
) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not found.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      modified_by_user_id: user.id,
    })
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error.message);
    throw new Error("Failed to update profile.");
  }

  // Return the profile data along with the user's email
  return {
    ...data,
    email: user.email,
  };
};

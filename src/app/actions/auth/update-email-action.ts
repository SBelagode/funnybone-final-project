"use server";

import { createClient } from "@/utils/supabase/server";

export const updateEmailAction = async (newEmail: string) => {
  const supabase = await createClient();

  // Fetch the current authenticated user
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();

  // Check if the user is authenticated
  if (sessionError || !user) {
    throw new Error("User is not authenticated");
  }

  // If the new email is the same as the current email, simply return without updating
  if (user.email === newEmail) {
    return { success: true }; // Return success without making any change
  }

  // Update the user's email
  const { error } = await supabase.auth.updateUser({
    email: newEmail,
  });

  // If there's an error updating the email, throw it
  if (error) {
    throw new Error(`Failed to update email: ${error.message}`);
  }

  return { success: true };
};

"use server";

import { createClient } from "@/utils/supabase/server";

export const updatePasswordAction = async (newPassword: string) => {
  const supabase = await createClient();

  // Fetch the current authenticated user
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();

  if (sessionError || !user) {
    console.error("User is not authenticated");
    throw new Error("User is not authenticated");
  }

  // Ensure the new password is not empty or too short
  if (!newPassword || newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  // Try updating the user's password
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  // Enhanced error handling: Log and throw the error with detailed message
  if (error) {
    console.error("Error updating password:", error);
    throw new Error(`Failed to update password: ${error.message}`);
  }

  // Optionally sign the user out after a successful password update to force them to log in again
  await supabase.auth.signOut({ scope: "global" });

  return {
    success: true,
    message:
      "Password updated successfully. Please log in again with your new password.",
  };
};

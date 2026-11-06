"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { encodedRedirect } from "@/utils/utils";
export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  // Get the current user (if they're anonymous)
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  const isAnonymous = currentUser?.app_metadata?.provider === "anonymous";

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Sign in error:", error.message);
    return encodedRedirect("error", "/login-with-email", error.message);
  }

  // Check if profile exists for the signed-in user
  if (signInData.user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", signInData.user.id)
      .single();

    if (profileError || !profile) {
      // Sign out the user since their profile doesn't exist (account was deleted)
      await supabase.auth.signOut({ scope: "local" });
      return encodedRedirect(
        "error",
        "/login-with-email",
        "Account has been deleted"
      );
    }

  }

  // If the user was previously anonymous, migrate their data
  if (isAnonymous && currentUser) {
    try {
      // Get the new user after sign in
      const {
        data: { user: newUser },
      } = await supabase.auth.getUser();

      if (!newUser) {
        throw new Error("Failed to get new user after sign in");
      }

      // Update the profile ID to match the new user's ID
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          id: newUser.id,
          modified_by_user_id: newUser.id,
        })
        .eq("id", currentUser.id);

      if (profileError) {
        console.error("Error updating profile:", profileError);
        return encodedRedirect(
          "error",
          "/login-with-email",
          "Failed to migrate profile"
        );
      }

      // Update any other tables that reference the profile_id
      const tablesToUpdate = ["images", "caption_saves", "captions"];
      for (const table of tablesToUpdate) {
        const { error: updateError } = await supabase
          .from(table)
          .update({
            profile_id: newUser.id,
            modified_by_user_id: newUser.id,
          })
          .eq("profile_id", currentUser.id);

        if (updateError) {
          console.error(`Error updating ${table} references:`, updateError);
        }
      }

    } catch (error) {
      console.error("Error during profile migration:", error);
      return encodedRedirect(
        "error",
        "/login-with-email",
        "Failed to migrate profile"
      );
    }
  }

  return redirect("/");
};

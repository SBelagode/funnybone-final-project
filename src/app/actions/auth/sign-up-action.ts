"use server";

import { headers } from "next/headers";

import { resolveEmailDomainStatus } from "@/utils/domain";
import { createClient } from "@/utils/supabase/server";
import { encodedRedirect } from "@/utils/utils";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";


export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const terms = formData.get("terms")?.toString();
  const privacy = formData.get("privacy")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const errorRedirectPath = "/sign-up/email"; // Define error path once

  if (!email || !password) {
    return encodedRedirect(
      "error",
      errorRedirectPath,
      "Email and password are required"
    );
  }

  if (!terms || !privacy) {
    return encodedRedirect(
      "error",
      errorRedirectPath,
      "You must agree to the Terms and Conditions and Privacy Policy to sign up"
    );
  }

  // Get the current user (if they're anonymous)
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  const isAnonymous = currentUser?.app_metadata?.provider === "anonymous";

  const {
    apexDomain,
    isAllowed: isDomainAllowed,
    error: domainStatusError,
  } = await resolveEmailDomainStatus(supabase, email);

  if (domainStatusError) {
    console.error("Error checking allowed signup domains:", domainStatusError);
  }

  if (!isDomainAllowed) {
    console.info(
      "User signed up with non-allowlisted domain",
      apexDomain ?? "<unknown>"
    );
  }

  // Check if user exists in auth but not in profiles (deleted account)
  const serviceRoleClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );

  const { data: authUsers } = await serviceRoleClient.auth.admin.listUsers();
  const existingAuthUser = authUsers.users.find((u) => u.email === email);

  if (existingAuthUser) {
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", existingAuthUser.id)
      .single();

    if (!existingProfile) {
      // User exists in auth but not in profiles (deleted account)
      // Delete the auth user first to allow new signup
      await serviceRoleClient.auth.admin.deleteUser(existingAuthUser.id);
    }
  }

  // Sign up the new user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(`${error.code} ${error.message}`);
    return encodedRedirect("error", errorRedirectPath, error.message);
  }

  if (!data.user) {
    console.error("No user data returned from sign up");
    return encodedRedirect(
      "error",
      errorRedirectPath,
      "Failed to create account"
    );
  }

  // If the user was previously anonymous, link their profile
  if (isAnonymous && currentUser) {
    try {
      // Update the profile ID to match the new user's ID
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          id: data.user.id,
          email,
          modified_by_user_id: data.user.id,
        })
        .eq("id", currentUser.id);

      if (profileError) {
        console.error("Error linking anonymous profile:", profileError);
        // Don't throw here, just log the error as the user can still continue
      }

      // Update any other tables that reference the profile_id
      // This includes images, caption_saves, etc.
      const tablesToUpdate = ["images", "caption_saves", "captions"];
      for (const table of tablesToUpdate) {
        const { error: updateError } = await supabase
          .from(table)
          .update({
            profile_id: data.user.id,
            modified_by_user_id: data.user.id,
          })
          .eq("profile_id", currentUser.id);

        if (updateError) {
          console.error(`Error updating ${table} references:`, updateError);
        }
      }
    } catch (error) {
      console.error("Error during profile linking:", error);
      // Don't throw here, just log the error as the user can still continue
    }
  } else {
    // Create a new profile for the user
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      email,
      created_by_user_id: data.user.id,
      modified_by_user_id: data.user.id,
    });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      // Don't throw here, just log the error as the user can still continue
    }
  }

  if (!isDomainAllowed) {
    // Ensure disallowed domains cannot keep an active session
    await supabase.auth.signOut({ scope: "local" });
    return encodedRedirect(
      "error",
      errorRedirectPath,
      "Your account is pending activation."
    );
  }

  // Success redirect remains targeted at the main sign-up page
  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link."
  );
};

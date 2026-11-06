"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export const signInWithGoogleAction = async () => {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  // Explicitly set the redirect URL to the auth callback endpoint
  const redirectUrl = `${origin}/auth/callback`;

  const { error, data } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl,
      // Add any needed query parameters
      queryParams: {
        // Add domain check parameter
        hd: "*", // This will ensure we get the email domain
      },
    },
  });

  if (error) {
    console.error("Error initiating Google sign-in:", error.message);
    throw new Error("Failed to sign in with Google: " + error.message);
  }

  return redirect(data.url);
};

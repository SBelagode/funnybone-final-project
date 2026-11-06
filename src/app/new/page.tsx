import { redirect } from "next/navigation";

import { GenerateRoasts } from "@/components/generate-roasts";
import { createClient } from "@/utils/supabase/server";

export default async function NewPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect if no user
  if (!user) {
    return redirect("/login");
  }

  // Redirect anonymous users to login
  if (user.app_metadata?.provider === "anonymous") {
    return redirect("/login");
  }

  // Check if user's profile exists
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    // Sign out the user and redirect to sign-in
    await supabase.auth.signOut({ scope: "local" });
    return redirect("/login?error=Account has been deleted");
  }

  return <GenerateRoasts redirectOnSelect />;
}

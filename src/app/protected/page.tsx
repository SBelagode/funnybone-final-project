import { redirect } from "next/navigation";

import { GenerateRoasts } from "@/components/generate-roasts";
import { createClient } from "@/utils/supabase/server";

export default async function ProtectedPage() {
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

  return <GenerateRoasts redirectOnSelect />;
}

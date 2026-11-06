import { createClient } from "@/utils/supabase/server";
import { ThemeAwareLogoClient } from "./theme-aware-logo-client";

export async function ThemeAwareLogo() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;

  return <ThemeAwareLogoClient isAuthenticated={isAuthenticated} />;
}

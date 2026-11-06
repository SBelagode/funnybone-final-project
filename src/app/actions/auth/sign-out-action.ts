"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  return redirect("/login");
};

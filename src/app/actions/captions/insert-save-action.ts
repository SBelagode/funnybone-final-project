"use server";

import { createClient } from "@/utils/supabase/server";

export const insertSaveAction = async (captionId: string) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User not found.");
  }
  // A plain insert of the two columns users may write (migration 032). An upsert would need
  // UPDATE permission, which users do not have on saves; audit columns are set by the database.
  const { data, error } = await supabase
    .from("caption_saves")
    .insert({ caption_id: captionId, profile_id: user.id })
    .select();

  if (error) {
    // Already saved (for example, a second click in another tab) counts as saved.
    if (error.code === "23505") return [];
    throw error;
  }

  return data;
};

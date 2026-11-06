"use server";

import { createClient } from "@/utils/supabase/server";

export const deleteSaveAction = async (captionId: string) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User not found.");
  }
  const { data, error } = await supabase
    .from("caption_saves")
    .delete()
    .match({ caption_id: captionId, profile_id: user.id });

  if (error) {
    throw error;
  }

  return data;
};

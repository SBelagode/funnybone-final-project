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
  const { data, error } = await supabase
    .from("caption_saves")
    .upsert([
      {
        caption_id: captionId,
        profile_id: user.id,
        created_by_user_id: user.id,
        modified_by_user_id: user.id,
      },
    ])
    .select();

  if (error) {
    throw error;
  }

  return data;
};

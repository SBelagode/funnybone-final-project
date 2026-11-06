"use server";

import { createClient } from "@/utils/supabase/server";

export const deleteCaptionsByImageAction = async (imageId: string) => {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from("captions")
    .delete()
    .match({ image_id: imageId, profile_id: user.id });

  if (error) {
    throw error;
  }
};

"use server";

import { createClient } from "@/utils/supabase/server";

export const deleteImageAction = async (imageUrl: string) => {
  const supabase = await createClient();
  const extractId = imageUrl.match(/([0-9a-fA-F\-]{36})(?=\.\w+$)/);

  const imageId = extractId ? extractId[1] : null;
  const { error } = await supabase.from("images").delete().eq("id", imageId);

  if (error) {
    throw error;
  }

};

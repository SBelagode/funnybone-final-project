"use server";

import { createClient } from "@/utils/supabase/server";

type CaptionWithImageRow = {
  id: string;
  content: string | null;
  image_id: string;
  is_public: boolean;
  profile_id: string;
  images:
    | {
        id: string;
        url: string | null;
      }
    | Array<{
        id: string;
        url: string | null;
      }>
    | null;
};

export const fetchCaptionByIdAction = async (captionID: string) => {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // fetch the caption
  const { data: caption, error: captionError } = await supabase
    .from("captions")
    .select(`
      id,
      content,
      image_id,
      is_public,
      profile_id,
      images!captions_image_id_fkey (
        id,
        url
      )
    `)
    .eq("id", captionID)
    .maybeSingle();

  if (captionError) {
    console.error("Error fetching caption:", captionError.message);
    throw new Error("Failed to fetch caption");
  }

  if (!caption) {
    throw new Error("Failed to fetch caption");
  }

  const normalizedCaption = caption as CaptionWithImageRow;
  const image = Array.isArray(normalizedCaption.images)
    ? normalizedCaption.images[0]
    : normalizedCaption.images;

  if (!image) {
    console.error("Error fetching image: related image not found for caption", captionID);
    throw new Error("Failed to fetch image");
  }

  return {
    id: normalizedCaption.id,
    content: normalizedCaption.content ?? "",
    roast_image_id: normalizedCaption.image_id,
    image_url: image.url ?? "",
    is_public: normalizedCaption.is_public,
    is_owner: user?.id === normalizedCaption.profile_id,
  };
};

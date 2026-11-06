"use server";

import { createClient } from "@/utils/supabase/server";

export const fetchUsedCommonUseImagesAction = async () => {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("User fetch error:", userError?.message);
    throw new Error("User not authenticated");
  }

  // Step 1: Fetch all user captions joined with image info
  const { data: captions, error: captionsError } = await supabase
    .from("captions")
    .select(`
      id,
      image_id,
      content,
      is_public,
      profile_id,
      created_datetime_utc,
      images (
        id,
        url,
        profile_id,
        image_description,
        additional_context,
        celebrity_recognition
      )
    `)
    .eq("profile_id", user.id)
    .order("created_datetime_utc", { ascending: false });

  if (captionsError) {
    console.error("Error fetching captions:", captionsError.message);
    throw new Error("Failed to fetch caption data.");
  }

  // Step 2: Group by (image_id + created_datetime_utc) — 1 tile per caption generation event
  const groupedMap = new Map<string, {
    id: string; // unique ID per caption gen event
    image_id: string;
    url: string;
    image_description?: string | null;
    additional_context?: string | null;
    celebrity_recognition?: string | null;
    created_datetime_utc: string;
    captions: {
      id: string;
      image_id: string;
      content: string;
      is_public: boolean;
      profile_id: string;
    }[];
  }>();

  for (const caption of captions || []) {
    const image = Array.isArray(caption.images) ? caption.images[0] : caption.images;
    if (!image || image.profile_id === user.id) continue; // skip user-uploaded

    const groupKey = image.id;

    if (!groupedMap.has(groupKey)) {
      groupedMap.set(groupKey, {
        id: groupKey, // used as unique React key
        image_id: image.id,
        url: image.url,
        image_description: image.image_description ?? null,
        additional_context: image.additional_context ?? null,
        celebrity_recognition: image.celebrity_recognition ?? null,
        created_datetime_utc: caption.created_datetime_utc,
        captions: [],
      });
    }

    groupedMap.get(groupKey)!.captions.push({
      id: String(caption.id),
      image_id: caption.image_id,
      content: caption.content,
      is_public: caption.is_public,
      profile_id: caption.profile_id,
    });
  }

  // Step 3: Return sorted by time descending
  return Array.from(groupedMap.values()).sort(
    (a, b) =>
      new Date(b.created_datetime_utc).getTime() -
      new Date(a.created_datetime_utc).getTime()
  );
};

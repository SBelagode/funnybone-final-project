"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Record or remove a vote for a caption
 * @param captionId - The caption ID to vote on
 * @param voteValue - 1 for upvote, -1 for downvote
 * @returns The inserted vote record
 */
export const toggleCaptionVoteAction = async (
  captionId: string,
  voteValue: 1 | -1
) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not found.");
  }

  // Find the user's most recent vote to determine toggle behavior
  const { data: latestVote, error: latestVoteError } = await supabase
    .from("caption_votes")
    .select("vote_value, created_datetime_utc")
    .eq("caption_id", captionId)
    .eq("profile_id", user.id)
    .order("created_datetime_utc", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestVoteError) {
    throw latestVoteError;
  }

  const latestVoteValue = Number(latestVote?.vote_value);
  const currentVote =
    latestVoteValue === 1 || latestVoteValue === -1
      ? (latestVoteValue as 1 | -1)
      : null;

  if (currentVote === voteValue) {
    const { error: deleteError } = await supabase
      .from("caption_votes")
      .delete()
      .eq("caption_id", captionId)
      .eq("profile_id", user.id);

    if (deleteError) {
      throw deleteError;
    }

    return null;
  }

  const { error: deleteError } = await supabase
    .from("caption_votes")
    .delete()
    .eq("caption_id", captionId)
    .eq("profile_id", user.id);

  if (deleteError) {
    throw deleteError;
  }

  // Insert new vote row
  const { data, error } = await supabase
    .from("caption_votes")
    .insert({
      caption_id: captionId,
      profile_id: user.id,
      vote_value: voteValue,
      created_by_user_id: user.id,
      modified_by_user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
};

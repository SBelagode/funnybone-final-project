"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Fetch the user's votes for multiple captions
 * @param captionIds - Array of caption IDs to check votes for
 * @returns Map of captionId to latest vote_value
 * (1 for upvote, -1 for downvote, or null if no vote)
 */
export const fetchUserCaptionVotesAction = async (
  captionIds: string[]
): Promise<Record<string, 1 | -1 | null>> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || captionIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from("caption_votes")
    .select("caption_id, vote_value, created_datetime_utc")
    .eq("profile_id", user.id)
    .in("caption_id", captionIds)
    .order("created_datetime_utc", { ascending: false });

  if (error) {
    console.error("Error fetching user votes:", error);
    return {};
  }

  // Create a map of captionId to vote_value
  const votesMap: Record<string, 1 | -1 | null> = {};
  
  // Initialize all captions with null (no vote)
  captionIds.forEach((id) => {
    votesMap[id] = null;
  });

  // Update with actual votes
  if (data) {
    data.forEach((vote) => {
      if (!vote.caption_id) {
        return;
      }
      if (votesMap[vote.caption_id] !== null) {
        return;
      }
      if (vote.vote_value !== null && vote.vote_value !== undefined) {
        // Ensure vote_value is properly cast (smallint can be 1 or -1)
        const voteValue = Number(vote.vote_value);
        if (voteValue === 1 || voteValue === -1) {
          votesMap[vote.caption_id] = voteValue as 1 | -1;
        }
      }
    });
  }

  return votesMap;
};

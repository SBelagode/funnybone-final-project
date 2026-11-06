import { fetchPopularCaptionsAction } from "@/app/actions/captions/fetch-popular-captions-action";
import { fetchUserCaptionVotesAction } from "@/app/actions/captions";
import { checkAuthStatusAction } from "@/app/actions/auth/check-auth-status";
import PopularCaptionsPageClient from "@/components/popular-captions-page-client";

type PopularCaptionsFilter = "all" | "year" | "past30" | "week";

type PopularCaption = {
  id: string;
  content: string;
  image_url: string;
  like_count: number;
  is_common_use: boolean;
  created_at: string;
};

interface PopularCaptionsPageProps {
  initialFilter?: PopularCaptionsFilter;
  pastWeekHref?: string;
  pastMonthHref?: string;
  pastYearHref?: string;
  allTimeHref?: string;
}

export default async function PopularCaptionsPage({
  initialFilter = "week",
  pastWeekHref,
  pastMonthHref,
  pastYearHref,
  allTimeHref,
}: PopularCaptionsPageProps) {
  const captions = (await fetchPopularCaptionsAction(
    100,
    initialFilter
  )) as PopularCaption[];
  const auth = await checkAuthStatusAction();
  const isAuthenticated = auth.isAuthenticated && !auth.isAnonymous;

  let initialUserVotes: Record<string, 1 | -1 | null> = {};
  if (isAuthenticated && captions.length > 0) {
    const captionIds = captions.map((caption) => caption.id);
    initialUserVotes = await fetchUserCaptionVotesAction(captionIds);
  }

  return (
    <PopularCaptionsPageClient
      initialFilter={initialFilter}
      pastWeekHref={pastWeekHref}
      pastMonthHref={pastMonthHref}
      pastYearHref={pastYearHref}
      allTimeHref={allTimeHref}
      initialCaptions={captions}
      initialUserVotes={initialUserVotes}
      initialIsAuthenticated={isAuthenticated}
    />
  );
}

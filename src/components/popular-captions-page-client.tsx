"use client";

import { useEffect, useRef, useState } from "react";
import { fetchPopularCaptionsAction } from "@/app/actions/captions/fetch-popular-captions-action";
import {
  toggleCaptionVoteAction,
  fetchUserCaptionVotesAction,
  insertSaveAction,
  deleteSaveAction,
  fetchSavedCaptionsAction,
} from "@/app/actions/captions";
import { useToast } from "@/hooks/use-toast";
import ShareModal from "@/components/share-modal";
import { IconChevronDown } from "@tabler/icons-react";
import { CaptionGridSkeleton } from "@/components/ui/image-grid-skeleton";
import { useRouter } from "next/navigation";
import { LoginPromptModal } from "@/components/ui/login-prompt-modal";
import { checkAuthStatusAction } from "@/app/actions/auth/check-auth-status";
import Link from "next/link";
import { ChevronUp, ChevronDown } from "lucide-react";
import { buildCaptionShareUrl } from "@/utils/site-url";
import { BrandImage } from "@/components/brand-image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CaptionModal } from "@/components/ui/caption-modal";
import { BookmarkButton } from "@/components/ui/bookmark-button";
import { Top100CaptionImage } from "@/components/top-100-caption-image";

// functions to load in our pregenrated thumbnails
const THUMBNAIL_SIZES = [320, 480, 640, 750, 828, 1080, 1200, 1920, 2048, 3840] as const;

const parseImageUrl = (url: string) => {
  // expects: https://images.domain.com/<userId>/<imageId>.<ext>
  const match = url.match(/https?:\/\/[^\/]+\/([^\/]+)\/([^\/\?]+)\.([^\/\?\s]+)/);
  if (match) {
    const [, userId, imageId, extension] = match;
    return { userId, imageId, extension };
  }
  return null;
};

const generateThumbnailUrls = (
  baseUrl: string,
  userId: string,
  imageId: string,
  extension: string
) => {
  const basePath = `${baseUrl}/${userId}/${imageId}`;
  return {
    original: `${basePath}.${extension}`,
    srcSet: THUMBNAIL_SIZES.map((size) => `${basePath}-${size}.${extension} ${size}w`).join(", "),
    gridUrl: `${basePath}-${THUMBNAIL_SIZES.find((s) => s >= 640) || 640}.${extension}`,
    blurUrl: `${basePath}-640.${extension}`,
  };
};

type PopularCaption = {
  id: string;
  content: string;
  image_url: string;
  like_count: number;
  is_common_use: boolean;
  created_at: string;
};

type PopularCaptionsFilter = "all" | "year" | "past30" | "week";

interface PopularCaptionsPageClientProps {
  initialFilter?: PopularCaptionsFilter;
  pastWeekHref?: string;
  pastMonthHref?: string;
  pastYearHref?: string;
  allTimeHref?: string;
  initialCaptions?: PopularCaption[];
  initialUserVotes?: Record<string, 1 | -1 | null>;
  initialIsAuthenticated?: boolean;
}

const filterOptions: Array<{ key: PopularCaptionsFilter; label: string }> = [
  { key: "week", label: "Past Week" },
  { key: "past30", label: "Past Month" },
  { key: "year", label: "Past Year" },
  { key: "all", label: "All Time" },
];

export default function PopularCaptionsPageClient({
  initialFilter = "week",
  pastWeekHref,
  pastMonthHref,
  pastYearHref,
  allTimeHref,
  initialCaptions = [],
  initialUserVotes = {},
  initialIsAuthenticated = false,
}: PopularCaptionsPageClientProps) {
  const [popularCaptions, setPopularCaptions] = useState<PopularCaption[]>(initialCaptions);
  const [userVotes, setUserVotes] = useState<Record<string, 1 | -1 | null>>(initialUserVotes);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [visibleCount, setVisibleCount] = useState(8);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialIsAuthenticated);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [savedCaptions, setSavedCaptions] = useState<string[]>([]);
  const isFirstLoad = useRef(true);

  const [filter, setFilter] = useState<PopularCaptionsFilter>(initialFilter);
  const filterHrefs: Partial<Record<PopularCaptionsFilter, string>> = {
    week: pastWeekHref,
    past30: pastMonthHref,
    year: pastYearHref,
    all: allTimeHref,
  };

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const captions = await fetchPopularCaptionsAction(100, filter);
        const auth = await checkAuthStatusAction();
        setIsAuthenticated(auth.isAuthenticated && !auth.isAnonymous);
        setPopularCaptions(captions);

        // Fetch user votes if authenticated
        if (auth.isAuthenticated && !auth.isAnonymous && captions.length > 0) {
          const captionIds = captions.map((c) => c.id);
          const votes = await fetchUserCaptionVotesAction(captionIds);
          console.log("Fetched user votes:", votes); // Debug log
          setUserVotes(votes);
          const saved = await fetchSavedCaptionsAction();
          setSavedCaptions(saved.map((caption) => caption.id));
        } else {
          // Clear votes if not authenticated
          setUserVotes({});
          setSavedCaptions([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load captions",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast, filter]);

  useEffect(() => {
    const fetchSavedCaptions = async () => {
      if (!isAuthenticated) {
        setSavedCaptions([]);
        return;
      }

      try {
        const saved = await fetchSavedCaptionsAction();
        setSavedCaptions(saved.map((caption) => caption.id));
      } catch (error) {
        console.error("Error fetching saved captions:", error);
        setSavedCaptions([]);
      }
    };

    fetchSavedCaptions();
  }, [isAuthenticated]);

  const handleVote = async (captionId: string, voteValue: 1 | -1) => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    const currentVote = userVotes[captionId] ?? null;
    const originalVote = currentVote;
    const originalCount = popularCaptions.find((c) => c.id === captionId)?.like_count || 0;

    // Optimistic update: determine new vote value
    let newVoteValue: 1 | -1 | null;
    if (currentVote === voteValue) {
      // If clicking the same vote, remove it
      newVoteValue = null;
    } else {
      // Otherwise, set the new vote
      newVoteValue = voteValue;
    }

    // Calculate optimistic count change
    let countChange = 0;
    if (originalVote === 1 && newVoteValue === null) {
      countChange = -1; // Removing upvote
    } else if (originalVote === -1 && newVoteValue === null) {
      countChange = 1; // Removing downvote
    } else if (originalVote === null && newVoteValue === 1) {
      countChange = 1; // Adding upvote
    } else if (originalVote === null && newVoteValue === -1) {
      countChange = -1; // Adding downvote
    } else if (originalVote === 1 && newVoteValue === -1) {
      countChange = -2; // Switching from upvote to downvote
    } else if (originalVote === -1 && newVoteValue === 1) {
      countChange = 2; // Switching from downvote to upvote
    }

    // Optimistic UI update
    setUserVotes((prev) => ({
      ...prev,
      [captionId]: newVoteValue,
    }));

    setPopularCaptions((prev) =>
      prev.map((caption) =>
        caption.id === captionId
          ? { ...caption, like_count: caption.like_count + countChange }
          : caption
      )
    );

    try {
      await toggleCaptionVoteAction(captionId, voteValue);
    } catch (error) {
      console.error("Error updating vote:", error);
      // Revert optimistic update
      setUserVotes((prev) => ({
        ...prev,
        [captionId]: originalVote,
      }));
      setPopularCaptions((prev) =>
        prev.map((caption) =>
          caption.id === captionId
            ? { ...caption, like_count: originalCount }
            : caption
        )
      );
      toast({
        title: "Error",
        description: "Failed to update vote",
      });
    }
  };

  const handleSlideSave = async (captionId: string) => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    const originalState = savedCaptions;
    const isSaved = savedCaptions.includes(captionId);

    try {
      if (isSaved) {
        setSavedCaptions((prev) => prev.filter((id) => id !== captionId));
        await deleteSaveAction(captionId);
      } else {
        setSavedCaptions((prev) => [...prev, captionId]);
        await insertSaveAction(captionId);
      }
    } catch (error) {
      console.error("Error saving/unsaving caption:", error);
      setSavedCaptions(originalState);
      toast({
        title: "Error",
        description: "Failed to update favorite.",
      });
    }
  };

  const handleImageClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleCloseCarousel = () => {
    setSelectedIndex(null);
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selectedIndex !== null) {
        handleCloseCarousel();
      }
    };

    const handleArrowKeys = (event: KeyboardEvent) => {
      if (selectedIndex === null || popularCaptions.length === 0) return;

      if (event.key === "ArrowLeft") {
        setSelectedIndex((prev) => {
          if (prev === null) return null;
          return prev === 0 ? popularCaptions.length - 1 : prev - 1;
        });
      } else if (event.key === "ArrowRight") {
        setSelectedIndex((prev) => {
          if (prev === null) return null;
          return prev === popularCaptions.length - 1 ? 0 : prev + 1;
        });
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleArrowKeys);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleArrowKeys);
    };
  }, [selectedIndex, popularCaptions.length]);

  const loadMore = () => {
    setVisibleCount((prev) => prev + itemsPerPage);
  };

  const handleItemsPerPageChange = (value: string) => {
    const newValue = parseInt(value);
    setItemsPerPage(newValue);
    setVisibleCount(newValue);
  };

  const visibleCaptions = popularCaptions.slice(0, visibleCount);
  const hasMore = visibleCount < popularCaptions.length;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4">
        <div
          className="flex justify-center mb-8 relative"
          style={{ height: "44px" }}
        >
          <div
            className="relative flex justify-between w-full max-w-[470px] 
                        h-[36px] sm:h-[44px] bg-transparent rounded-3xl mx-auto
                        border border-[#666363] overflow-hidden"
          >
            <div
              className={[
                "absolute inset-y-0 left-0 w-1/4 rounded-[16px]",
                "bg-gray-500/20 animate-skeleton",
              ].join(" ")}
            />
            {/* Filter buttons skeleton */}
            <div className="w-full flex relative z-10">
              {filterOptions.map(({ label }) => (
                <div key={label} className="w-1/4 flex items-center justify-center">
                  <div className="h-4 w-16 bg-gray-400 rounded animate-skeleton" />
                </div>
              ))}
            </div>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-[2px] bg-[#666363]"
                style={{ left: `${i * 25}%` }}
              />
            ))}
          </div>
        </div>
        <CaptionGridSkeleton count={8} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-1 py-1">
      {/* Mobile-only Get Crackd Box */}
      <div className="block sm:hidden w-full mb-8">
        <div
          className="bg-gray-50 dark:bg-neutral-800 rounded-2xl p-8 flex
                      flex-col items-center justify-center"
        >
          <div className="relative w-24 h-24 mb-4">
            <BrandImage variant="mark" alt="Crackd Logo" className="w-full h-full" />
          </div>
          <h2
            className="text-gray-900 dark:text-white text-4xl font-bold
                        tracking-tight scale-y-150"
          >
            GET CRACKD
          </h2>
        </div>
      </div>

      <div className="flex justify-center mb-8 relative" style={{ height: "44px" }}>
        <div
          className="relative flex justify-between w-full max-w-[470px] h-[36px] sm:h-[44px] 
                      bg-transparent rounded-3xl mx-auto border border-[#666363] overflow-hidden"
        >
          {/* Primary Slider */}
          <div
            className={`absolute top-0 left-0 h-[36px] sm:h-[44px] w-1/4 rounded-[16px] 
              bg-primary dark:bg-primary/40
                       transition-all duration-300 ${
                        filter === "week"
                          ? "rounded-l-3xl rounded-r-none"
                          : filter === "all"
                          ? "rounded-r-3xl rounded-l-none"
                          : "rounded-none"
                      }`}
            style={{
              transform: `translateX(${(
                filter === "week" ? 0 :
                filter === "past30" ? 100 :
                filter === "year" ? 200 : 300
              )}%)`,
            }}
          />

          {/* Buttons */}
          {filterOptions.map(({ key, label }) => {
            const isActive = filter === key;
            const className = `relative w-1/4 h-full flex items-center justify-center
                          text-xs sm:text-sm md:text-base font-normal leading-[120%]
                          tracking-[-0.02em] z-10 transition-colors 
                          duration-200 ${
                            isActive
                              ? "text-white dark:text-white border-2 border-primary"
                              : "text-gray-800 dark:text-[#9A9A9A]"
                          } ${
                            key === "week"
                              ? "rounded-l-3xl rounded-r-none"
                              : key === "all"
                              ? "rounded-r-3xl rounded-l-none"
                              : "rounded-none"
                          }`;

            const href = filterHrefs[key];
            if (href) {
              return (
                <Link key={key} href={href} className={className}>
                  {label}
                </Link>
              );
            }

            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={className}
              >
                {label}
              </button>
            );
          })}

          {/* Vertical Borders */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-[2px] bg-[#666363]"
              style={{ left: `${i * 25}%` }}
            />
          ))}
        </div>
      </div>
      <div className="flex-1 w-full flex flex-col gap-8 p-4 relative">
        <div className="flex justify-end items-center w-full max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Show</span>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 bg-background/30 border border-primary/20
                            rounded-lg px-3 py-1.5 text-sm text-primary
                            hover:border-primary/40 transition-colors duration-200"
                >
                  {itemsPerPage}
                  <IconChevronDown className="w-4 h-4" />
                </button>
                {isDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-20 bg-background/90 border
                                  border-primary/20 rounded-lg shadow-lg overflow-hidden z-50"
                  >
                    {[4, 8, 12, 16, 20, 24].map((value) => (
                      <button
                        key={value}
                        onClick={() => {
                          handleItemsPerPageChange(value.toString());
                          setIsDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-sm text-primary hover:bg-primary/10
                                  transition-colors duration-200 text-left"
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-sm text-muted-foreground">at a time</span>
            </div>
          </div>
        </div>
      {visibleCaptions.length === 0 ? (
        <p className="text-center text-gray-400 mt-12 text-lg">No captions found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {visibleCaptions.map((caption, index) => {
            // generate our thumbnail urls
            const info = parseImageUrl(caption.image_url);
            let displayUrl = caption.image_url;

            let srcSet: string | undefined;
            if (info) {
              const baseUrl = caption.image_url.split("/").slice(0, 3).join("/");
              const t = generateThumbnailUrls(baseUrl, info.userId, info.imageId, info.extension);
              displayUrl = t.gridUrl;
              srcSet = t.srcSet;
            }

            const shareUrl = buildCaptionShareUrl(caption.id);
            const currentVote = userVotes[caption.id] ?? null;
            const isUpvoted = currentVote === 1;
            const isDownvoted = currentVote === -1;

            return (
              <div
                key={caption.id}
                className="relative cursor-pointer group w-full h-full flex"
                onClick={() => handleImageClick(index)}
              >
                <div
                  className="relative bg-white dark:bg-[#1a1a1a] rounded-lg overflow-hidden
                         shadow-md dark:shadow-lg ring-1 ring-gray-200 dark:ring-0
                         hover:shadow-xl transition-all duration-300 flex flex-col w-full
                         sm:max-w-[320px] sm:mx-auto"
                >
                  {/* Top Section - Branding */}
                  <div className="p-3 flex justify-between items-center">
                    {/* Left: Crackd branding */}
                    <div className="flex items-center gap-2">
                      <BrandImage variant="mark" alt="Crackd" className="w-6 h-6" />
                      <span className="text-primary text-sm font-bold">Crackd</span>
                    </div>

                    {/* Right: Upvote/Downvote counter */}
                    <TooltipProvider>
                      <div className="flex flex-col items-center gap-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                handleVote(caption.id, 1);
                              }}
                              className={`cursor-pointer transition-colors ${
                                isUpvoted
                                  ? "text-primary"
                                  : "text-gray-500 dark:text-gray-400 hover:text-primary"
                              }`}
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="left"
                            className="bg-white text-gray-900 border border-gray-200
                                       dark:bg-[#2a2a2a] dark:text-white
                                       dark:border-gray-700/50"
                          >
                            <p>Upvote</p>
                          </TooltipContent>
                        </Tooltip>
                        <span className="text-gray-900 dark:text-white text-sm font-medium">
                          {caption.like_count}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                handleVote(caption.id, -1);
                              }}
                              className={`cursor-pointer transition-colors ${
                                isDownvoted
                                  ? "text-primary"
                                  : "text-gray-500 dark:text-gray-400 hover:text-primary"
                              }`}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="left"
                            className="bg-white text-gray-900 border border-gray-200
                                       dark:bg-[#2a2a2a] dark:text-white
                                       dark:border-gray-700/50"
                          >
                            <p>Downvote</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </div>

                  {/* Caption Text - Below header */}
                  <div className="px-3 pb-3">
                    <p
                      className="text-gray-900 dark:text-white text-base leading-relaxed
                                 font-medium"
                    >
                      {caption.content}
                    </p>
                  </div>

                  {/* Main Image */}
                  <div className="w-full flex-1 min-h-[320px] px-3 pb-3">
                    <Top100CaptionImage
                      src={displayUrl}
                      srcSet={srcSet}
                      captionId={caption.id}
                    />
                  </div>

                  {/* Bottom Action Bar */}
                  <div
                    className="p-3 bg-gray-50 dark:bg-[#1a1a1a] border-t border-gray-200
                               dark:border-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="p-2 text-gray-600 dark:text-white hover:bg-gray-200/70
                                    dark:hover:bg-white/10 rounded transition-colors flex
                                    items-center justify-center"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <BookmarkButton
                          bookmarked={savedCaptions.includes(caption.id)}
                          onClick={() => handleSlideSave(caption.id)}
                          size={20}
                        />
                      </div>
                      <div
                        className="p-2 hover:bg-gray-200/70 dark:hover:bg-white/10 rounded
                                    transition-colors flex items-center justify-center"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <ShareModal
                          shareUrl={shareUrl}
                          buttonClassName="text-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  className="px-6 py-2 bg-primary/20 hover:bg-primary/30 text-primary
                             rounded-full transition-colors duration-200"
                >
                  Load More
                </button>
              </div>
            )}

      {/* Modal */}
      {selectedIndex !== null && popularCaptions.length > 0 && (
        <CaptionModal
          items={popularCaptions.map((caption) => ({
            id: caption.id,
            content: caption.content,
            imageUrl: caption.image_url,
          }))}
          currentIndex={selectedIndex}
          onClose={handleCloseCarousel}
          onIndexChange={(index) => setSelectedIndex(index)}
          savedCaptionIds={savedCaptions}
          onSave={handleSlideSave}
          wrapNavigation
        />
      )}
      
      {/* New Post button */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-40">
        <a
          href="/new"
          className="flex items-center justify-center w-48 h-12 rounded-full
                    bg-primary text-primary-foreground font-bold text-lg shadow-lg
                    hover:bg-primary/90 transition-colors duration-200
                    select-none"
        >
          New Post
        </a>
      </div>
      {/* Login Prompt Modal */}
      <LoginPromptModal
        open={showLoginPrompt}
        onOpenChange={setShowLoginPrompt}
        onProceed={() => {
          setShowLoginPrompt(false);
          router.push("/login");
        }}
      />
    </div>
  );
}

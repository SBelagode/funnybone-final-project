"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteSaveAction, fetchSavedCaptionsAction } from "@/app/actions/captions";
import { checkAuthStatusAction } from "@/app/actions/auth/check-auth-status";
import { useToast } from "@/hooks/use-toast";
import { IconChevronDown } from "@tabler/icons-react";
import { Bookmark } from "lucide-react";
import ShareModal from "@/components/share-modal";
import { FavoritesGridSkeleton } from "@/components/ui/image-grid-skeleton";
import { CaptionModal } from "@/components/ui/caption-modal";
import { BookmarkButton } from "@/components/ui/bookmark-button";
import { buildCaptionShareUrl } from "@/utils/site-url";
import { BrandImage } from "@/components/brand-image";
import { Input } from "@/components/ui/input";

const THUMBNAIL_SIZES = [320, 480, 640, 750, 828, 1080, 1200, 1920, 2048, 3840] as const;

type SavedCaption = {
  id: string;
  content: string;
  image_id: string;
  image_url: string;
  image_description?: string | null;
  image_additional_context?: string | null;
  image_celebrity_recognition?: string | null;
};

const parseImageUrl = (url: string) => {
  // expects: https://images.domain.com/<userId>/<imageId>.<ext>
  const m = url.match(/https?:\/\/[^\/]+\/([^\/]+)\/([^\/\?]+)\.([^\/\?\s]+)/);
  if (!m) return null;
  const [, userId, imageId, extension] = m;
  return { userId, imageId, extension };
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
  };
};

export default function SavedCaptionsPage() {
  const [savedCaptions, setSavedCaptions] = useState<SavedCaption[]>([]);
  const { toast } = useToast();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(8);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredCaptions = savedCaptions.filter((caption) => {
    if (!normalizedSearchTerm) return true;
    return [
      caption.content,
      caption.image_id,
      caption.image_url,
      caption.id,
      caption.image_description,
      caption.image_additional_context,
      caption.image_celebrity_recognition,
    ]
      .filter((value): value is string => typeof value === "string" && value.length > 0)
      .some((value) => value.toLowerCase().includes(normalizedSearchTerm));
  });

  useEffect(() => {
    let isActive = true;
    const fetchCaptions = async () => {
      try {
        setIsLoading(true);
        const auth = await checkAuthStatusAction();
        if (!auth.isAuthenticated || auth.isAnonymous) {
          router.push("/login");
          return;
        }
        const captions = await fetchSavedCaptionsAction();
        if (isActive) {
          setSavedCaptions(captions);
        }
      } catch (error) {
        console.error("Error fetching saved captions:", error);
        const auth = await checkAuthStatusAction();
        if (!auth.isAuthenticated || auth.isAnonymous) {
          router.push("/login");
          return;
        }
        toast({
          title: "Error",
          description: "Failed to load your favorite captions.",
        });
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchCaptions();
    return () => {
      isActive = false;
    };
  }, [toast, router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selectedIndex !== null) {
        handleCloseCarousel();
      }
    };

    const handleArrowKeys = (event: KeyboardEvent) => {
      if (selectedIndex === null) return;

      if (event.key === "ArrowLeft") {
        setSelectedIndex((prev) => {
          if (prev === null) return null;
          return prev === 0 ? filteredCaptions.length - 1 : prev - 1;
        });
      } else if (event.key === "ArrowRight") {
        setSelectedIndex((prev) => {
          if (prev === null) return null;
          return prev === filteredCaptions.length - 1 ? 0 : prev + 1;
        });
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleArrowKeys);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleArrowKeys);
    };
  }, [selectedIndex, filteredCaptions.length]);

  const handleSlideSave = async (captionId: string) => {
    try {
      await deleteSaveAction(captionId);
      setSavedCaptions((prev) => prev.filter((caption) => caption.id !== captionId));
      setSelectedIndex(null);
    } catch (error) {
      console.error("Error unsaving caption:", error);
      toast({
        title: "Error",
        description: "Failed to unsave the caption.",
      });
    }
  };

  const handleImageClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleCloseCarousel = () => {
    setSelectedIndex(null);
  };

  const loadMore = () => {
    setVisibleCount((prev) => prev + itemsPerPage);
  };

  const handleItemsPerPageChange = (value: string) => {
    const newValue = parseInt(value);
    setItemsPerPage(newValue);
    setVisibleCount(newValue);
  };

  const visibleCaptions = filteredCaptions.slice(0, visibleCount);
  const hasMore = visibleCount < filteredCaptions.length;
  const displayCount = normalizedSearchTerm ? filteredCaptions.length : savedCaptions.length;

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setVisibleCount(itemsPerPage);
    setSelectedIndex(null);
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-8 p-4 relative">
      <div className="w-full">
        <div className="w-full max-w-7xl mx-auto px-4 space-y-3">
          {/* Left Header */}
          <h1
            className="text-base sm:text-2xl font-normal flex items-center gap-2 text-primary"
          >
            Your Favorite Captions
            <span className="text-primary/75 text-base sm:text-lg">
              ({displayCount})
            </span>
          </h1>
          <div className="flex items-center justify-between gap-3 text-sm">
            <Input
              value={searchTerm}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Search captions"
              className="h-[40px] max-w-[220px] text-left"
              aria-label="Search favorite captions"
            />
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-muted-foreground hidden sm:inline">Show</span>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex h-10 items-center gap-2 bg-background/30 border border-primary/20
                             rounded-lg px-3 text-sm text-primary
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
              <span className="text-muted-foreground text-xs sm:text-sm">per page</span>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="w-full max-w-7xl mx-auto p-4">
          <FavoritesGridSkeleton count={itemsPerPage} />
        </div>
      ) : filteredCaptions.length > 0 ? (
        <>
          <div className="w-full max-w-7xl mx-auto p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {visibleCaptions.map((caption, index) => {
                // generate our thumbnail urls
                const info = parseImageUrl(caption.image_url);
                let displayUrl = caption.image_url;

                let srcSet: string | undefined;
                if (info) {
                  const baseUrl = caption.image_url.split("/").slice(0, 3).join("/");
                  const t = generateThumbnailUrls(
                    baseUrl,
                    info.userId,
                    info.imageId,
                    info.extension
                  );
                  displayUrl = t.gridUrl;
                  srcSet = t.srcSet;
                }

                const shareUrl = buildCaptionShareUrl(caption.id);

                return (
                  <div
                    key={caption.id}
                    className="relative cursor-pointer group w-full h-full flex"
                    onClick={() => handleImageClick(index)}
                  >
                    <div
                      className="relative bg-[#1a1a1a] rounded-lg overflow-hidden shadow-lg
                                  hover:shadow-xl transition-all duration-300 flex flex-col
                                  w-full sm:max-w-[350px] sm:mx-auto h-full"
                    >
                      {/* Top Section - Branding */}
                      <div className="p-3 flex justify-between items-center flex-shrink-0">
                        {/* Left: Crackd branding */}
                        <div className="flex items-center gap-2">
                          <BrandImage variant="mark" alt="Crackd" className="w-6 h-6" />
                          <span className="text-primary text-sm font-bold">Crackd</span>
                        </div>
                      </div>

                      {/* Caption Text - Below header */}
                      <div className="px-3 pb-3 flex-shrink-0">
                        <p
                          className="text-white text-base leading-relaxed font-medium line-clamp-3"
                        >
                          {caption.content}
                        </p>
                      </div>

                      {/* Main Image */}
                      <div className="w-full flex-1 min-h-[320px] px-3 pb-3">
                        <div className="relative w-full h-full">
                          <img
                            src={displayUrl}
                            srcSet={srcSet}
                            sizes="(max-width: 640px) 320px, (max-width: 768px) 320px, 320px"
                            alt={`Caption Image ${caption.id}`}
                            className="absolute inset-0 w-full h-full object-contain sm:object-cover rounded"
                            loading="lazy"
                          />
                        </div>
                      </div>

                      {/* Bottom Action Bar */}
                      <div className="p-3 bg-[#1a1a1a] border-t border-white/10 flex-shrink-0">
                        <div className="flex items-center justify-between">
                          <div
                            className="p-2 hover:bg-white/10 rounded transition-colors
                                        flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <BookmarkButton
                              bookmarked={true}
                              onClick={() => {
                                handleSlideSave(caption.id);
                              }}
                              size={20}
                            />
                          </div>
                          <div
                            className="p-2 hover:bg-white/10 rounded transition-colors
                                        flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ShareModal
                              shareUrl={shareUrl}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
          </div>

          {/* Modal */}
          {selectedIndex !== null && (
            <CaptionModal
              items={filteredCaptions.map((caption) => ({
                id: caption.id,
                content: caption.content,
                imageUrl: caption.image_url,
              }))}
              currentIndex={selectedIndex}
              onClose={handleCloseCarousel}
              onIndexChange={(index) => setSelectedIndex(index)}
              savedCaptionIds={savedCaptions.map((caption) => caption.id)}
              onSave={handleSlideSave}
              wrapNavigation
            />
          )}
        </>
      ) : (
        <div className="text-center space-y-4">
          <Bookmark className="w-16 h-16 text-muted-foreground mx-auto" />
          {normalizedSearchTerm ? (
            <p className="text-xl text-muted-foreground">No captions match your search.</p>
          ) : (
            <>
              <p className="text-xl text-muted-foreground">No favorite captions yet!</p>
              <p className="text-sm text-muted-foreground">
                Start bookmarking captions to see them here
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

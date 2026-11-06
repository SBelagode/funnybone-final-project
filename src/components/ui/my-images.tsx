import { useRef, useState } from 'react';
import { IconChevronDown } from '@tabler/icons-react'
import { MyImagesGridSkeleton } from '@/components/ui/image-grid-skeleton'
import { ImageWithCaptions } from '@/utils/types'
import { Input } from '@/components/ui/input'

export const PhotoTabContent = ({
  tabName,
  images,
  visibleImages,
  loading,
  hasMore,
  itemsPerPage,
  dropdownItems,
  handleItemsPerPageChange,
  searchTerm,
  handleSearchChange,
  handleImageSelect,
  loadMore,
  emptyMessage,
}: {
  tabName: string;
  images: ImageWithCaptions[];
  visibleImages: ImageWithCaptions[];
  loading: boolean;
  hasMore: boolean;
  itemsPerPage: number;
  dropdownItems: Array<number>;
  handleItemsPerPageChange: (value: string) => void;
  searchTerm: string;
  handleSearchChange: (value: string) => void;
  handleImageSelect: (imageId: string) => void;
  loadMore: () => void;
  emptyMessage: string;
}) => {
  const dropdownRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  const buildThumbSources = (url: string) => {
    const info = parseImageUrl(url);
    if (!info) {
      return {
        displayUrl: url,
        srcSet: '',
      };
    }
    const baseUrl = url.split('/').slice(0, 3).join('/');
    const basePath = `${baseUrl}/${info.userId}/${info.imageId}`;
    const srcSet = THUMBNAIL_SIZES.map((s) => 
      `${basePath}-${s}.${info.extension} ${s}w`).join(', ');
    const displayUrl = 
      `${basePath}-${THUMBNAIL_SIZES.find((s) => s >= 640) || 640}.${info.extension}`;
    return { displayUrl, srcSet };
  };

  const GRID_SIZES = '(max-width: 640px) 50vw, (max-width: 768px) 33vw,'+
  '(max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw';

  return (
    <div className="flex-1 w-full flex flex-col gap-8 items-center justify-center relative">
      {/* Header with dropdown */}
      <div className="w-full">
        <div className="w-full max-w-7xl mx-auto px-4 space-y-3">
          {/* Left Header */}
          <h1
            className="text-base sm:text-2xl font-normal flex items-center gap-2 text-primary"
          >
            {tabName}
          </h1>
          <div className="flex items-center justify-between gap-3 text-sm">
            <Input
              value={searchTerm}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Search photos"
              className="h-[40px] max-w-[220px] text-left"
              aria-label={`${tabName} search`}
            />
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-muted-foreground hidden sm:inline">Show</span>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex h-10 items-center gap-2 bg-background/30 
                              border border-primary/20 rounded-lg px-3 
                              text-sm text-primary hover:border-primary/40 
                              transition-colors duration-200"
                >
                  {itemsPerPage}
                  <IconChevronDown className="w-4 h-4" />
                </button>
                {isDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-20 bg-background/90 
                                border border-primary/20 rounded-lg shadow-lg 
                                overflow-hidden z-50"
                  >
                    {dropdownItems.map((value) => (
                      <button
                        key={value}
                        onClick={() => {
                          handleItemsPerPageChange(value.toString());
                          setIsDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-sm text-primary 
                                   hover:bg-primary/10 transition-colors 
                                   duration-200 text-left"
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

      {/* Image Grid */}
      {loading ? (
        <div className="w-full max-w-7xl mx-auto">
          <MyImagesGridSkeleton count={itemsPerPage} />
        </div>
      ) : images.length > 0 ? (
        <div className="w-full max-w-7xl mx-auto">
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4
                       gap-3 sm:gap-4 
                       md:gap-5 lg:gap-6"
          >
            {visibleImages.map((image) => {
              const { displayUrl, srcSet } = buildThumbSources(image.url);
              return (
                <div
                  key={image.id}
                  className="relative rounded-lg overflow-hidden cursor-pointer group
                            aspect-[5/6] bg-gray-100 dark:bg-gray-800
                            border-[3px] border-[#555555]/33"
                  style={{borderRadius: '25%'}}
                  onClick={() => handleImageSelect(image.id)}
                >
                  <img
                    src={displayUrl}
                    srcSet={srcSet}
                    sizes={GRID_SIZES}
                    alt={`Image ${image.id}`}
                    className="absolute inset-0 w-full h-full object-cover
                               transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              );
            })}
          </div>

          {/* Load More button */}
          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={loadMore}
                className="bg-primary/10 text-primary border 
                         border-primary/20 px-4 py-2 rounded-lg 
                         text-sm hover:bg-primary/20 transition-colors 
                         duration-200"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground">{emptyMessage}</p>
      )}
    </div>
  );
};

export default PhotoTabContent;

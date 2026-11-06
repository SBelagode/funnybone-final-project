import React from 'react'

interface ImageGridSkeletonProps {
  count?: number
  columns?: string
}

export function ImageGridSkeleton({
  count = 8,
  columns = 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4',
}: ImageGridSkeletonProps) {
  return (
    <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
      <div className={`grid ${columns} gap-4 sm:gap-5 md:gap-6`}>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="relative rounded-2xl overflow-hidden 
            border-2 border-[#555555] w-full aspect-square 
            bg-gradient-to-br from-gray-100/50 to-gray-200/50 
            dark:from-gray-800/50 dark:to-gray-900/50"
          >
            {/* Main skeleton content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full bg-gray-300 dark:bg-gray-700 rounded-lg">
                {/* Image placeholder */}
                <div
                  className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 
                  dark:from-gray-600 dark:to-gray-700 animate-skeleton"
                />
              </div>
            </div>

            {/* Button placeholder */}
            <div
              className="
                absolute inset-0 bg-black/20 flex items-center justify-center
              "
            >
              <div
                className="
                  bg-gray-300 dark:bg-gray-600 px-4 py-2 rounded-lg animate-skeleton
                "
              >
                <div className="w-12 h-4 bg-gray-400 dark:bg-gray-500 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Skeleton for my-images page - matches the simple image grid layout
export function MyImagesGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className={[
        'grid',
        'grid-cols-2',
        'sm:grid-cols-3',
        'md:grid-cols-4',
        'gap-3',
        'sm:gap-4',
        'md:gap-5',
        'lg:gap-6',
      ].join(' ')}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="
            relative overflow-hidden cursor-pointer
            w-full aspect-[5/6] bg-gray-100 dark:bg-gray-800
            border-[3px] border-[#555555]/33
          "
          style={{ borderRadius: '25%' }}
        >
          {/* Image placeholder */}
          <div
            className="w-full h-full bg-gradient-to-br 
            from-gray-200 to-gray-300 dark:from-gray-700 
            dark:to-gray-800 animate-skeleton"
          />

          <div className="absolute bottom-0 left-0 w-full bg-black/80 px-10 py-5">
            <div className="h-3 w-16 bg-primary/40 animate-skeleton" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Skeleton for favorites page - matches favorites card layout
export function FavoritesGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="relative bg-[#1a1a1a] rounded-lg overflow-hidden shadow-lg
                     w-full sm:max-w-[350px] sm:mx-auto h-full"
        >
          {/* Header */}
          <div className="p-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-600/60 rounded-full animate-skeleton" />
              <div className="h-3 w-16 bg-gray-600/60 rounded animate-skeleton" />
            </div>
          </div>

          {/* Caption Text */}
          <div className="px-3 pb-3 space-y-2">
            <div className="h-4 bg-gray-600/60 rounded w-11/12 animate-skeleton" />
            <div className="h-4 bg-gray-600/60 rounded w-9/12 animate-skeleton" />
            <div className="h-4 bg-gray-600/60 rounded w-7/12 animate-skeleton" />
          </div>

          {/* Main Image */}
          <div className="w-full flex-1 min-h-[320px] px-3 pb-3">
            <div className="w-full h-full bg-gray-700/60 rounded animate-skeleton" />
          </div>

          {/* Bottom Action Bar */}
          <div className="p-3 bg-[#1a1a1a] border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 bg-gray-700/60 rounded-full animate-skeleton" />
              <div className="w-8 h-8 bg-gray-700/60 rounded-full animate-skeleton" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Skeleton for top-100 page - matches actual height and proportions
export function CaptionGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="
            relative bg-white dark:bg-[#1a1a1a] rounded-lg overflow-hidden shadow-md
            dark:shadow-lg ring-1 ring-gray-200 dark:ring-0 w-full sm:max-w-[320px]
            sm:mx-auto flex flex-col
          "
        >
          {/* Top Section - Branding */}
          <div className="p-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700/60
                           animate-skeleton"
              />
              <div
                className="h-3 w-14 bg-gray-200 dark:bg-gray-600/60 rounded
                           animate-skeleton"
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-3 h-3 bg-gray-200 dark:bg-gray-600/60 rounded-sm
                           animate-skeleton"
              />
              <div
                className="w-6 h-3 bg-gray-200 dark:bg-gray-600/60 rounded
                           animate-skeleton"
              />
              <div
                className="w-3 h-3 bg-gray-200 dark:bg-gray-600/60 rounded-sm
                           animate-skeleton"
              />
            </div>
          </div>

          {/* Caption Text */}
          <div className="px-3 pb-3 space-y-2">
            <div
              className="h-4 bg-gray-200 dark:bg-gray-600/60 rounded w-11/12
                         animate-skeleton"
            />
            <div
              className="h-4 bg-gray-200 dark:bg-gray-600/60 rounded w-9/12
                         animate-skeleton"
            />
            <div
              className="h-4 bg-gray-200 dark:bg-gray-600/60 rounded w-7/12
                         animate-skeleton"
            />
          </div>

          {/* Main Image */}
          <div className="w-full flex-1 min-h-[320px] px-3 pb-3">
            <div
              className="w-full h-full bg-gray-200 dark:bg-gray-700/60 rounded
                         animate-skeleton"
            />
          </div>

          {/* Bottom Action Bar */}
          <div
            className="p-3 bg-gray-50 dark:bg-[#1a1a1a] border-t border-gray-200
                       dark:border-white/10"
          >
            <div className="flex items-center justify-between">
              <div
                className="w-8 h-8 bg-gray-200 dark:bg-gray-700/60 rounded-full
                           animate-skeleton"
              />
              <div
                className="w-8 h-8 bg-gray-200 dark:bg-gray-700/60 rounded-full
                           animate-skeleton"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

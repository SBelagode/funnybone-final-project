'use client'

import ShareModal from '@/components/share-modal'
import { BookmarkButton } from '@/components/ui/bookmark-button'
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa6'
import { updateCaptionPublicAction } from '@/app/actions/captions'
import { useToast } from '@/hooks/use-toast'
import { useState, useEffect } from 'react'
import { BrandImage } from '@/components/brand-image'

export function CaptionViewV2({
  id,
  imageUrl,
  content,
  saved,
  onSave,
  shareUrl,
  isPublic: initialIsPublic,
  isOwner,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  currentIndex = 0,
  totalCount = 1,
  imageClassName,
  tone = 'dark',
  containerClassName,
}: {
  id: string
  imageUrl: string
  content: string
  saved: boolean
  onSave: (captionId: string) => void | Promise<void>
  shareUrl: string
  isPublic: boolean
  isOwner: boolean
  onPrevious?: () => void
  onNext?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
  currentIndex?: number
  totalCount?: number
  imageClassName?: string
  tone?: 'dark' | 'auto'
  containerClassName?: string
}) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isPosting, setIsPosting] = useState(false)
  const [isSaved, setIsSaved] = useState(saved)
  const { toast } = useToast()
  const imageClasses =
    imageClassName ??
    'w-full h-auto max-w-[400px] sm:max-w-[500px] md:max-w-[600px] max-h-[500px] sm:max-h-[600px] md:max-h-[700px] object-contain'
  const containerClasses =
    containerClassName ?? 'w-full flex items-center justify-center mb-8 mt-12'
  const isAutoTone = tone === 'auto'
  const hoverBgClass = isAutoTone ? 'hover:bg-foreground/10' : 'hover:bg-white/10'
  const iconColorClass = isAutoTone ? 'text-foreground' : 'text-white'
  const dividerClass = isAutoTone ? 'bg-foreground/20' : 'bg-white/20'
  const captionTextClass = isAutoTone ? 'text-foreground' : 'text-white'
  const inactiveDotClass = isAutoTone ? 'bg-muted-foreground' : 'bg-gray-500'

  // Update isSaved when saved prop changes
  useEffect(() => {
    setIsSaved(saved)
  }, [saved])

  // Handle posting caption (making it public) - internal to this component
  const handlePostCaption = async (captionId: string) => {
    console.log('handlePostCaption called with:', captionId)
    console.log('isPosting:', isPosting)

    if (isPosting) return // Prevent multiple clicks

    setIsPosting(true)
    try {
      console.log('Calling updateCaptionPublicAction...')
      await updateCaptionPublicAction(captionId, true)
      console.log('updateCaptionPublicAction completed successfully')

      // Update local state to reflect the change
      setIsPublic(true)
      toast({
        title: 'Caption Posted!',
        description: 'Your caption has been made public and is now visible to others.',
      })
    } catch (error) {
      console.error('Error posting caption:', error)
      toast({
        title: 'Post Failed',
        description: 'Failed to post caption. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsPosting(false)
    }
  }

  // Handle unposting caption (making it private) - internal to this component
  const handleUnpostCaption = async (captionId: string) => {
    console.log('handleUnpostCaption called with:', captionId)
    console.log('isPosting:', isPosting)

    if (isPosting) return // Prevent multiple clicks

    setIsPosting(true)
    try {
      console.log('Calling updateCaptionPublicAction to unpost...')
      await updateCaptionPublicAction(captionId, false)
      console.log('updateCaptionPublicAction completed successfully')

      // Update local state to reflect the change
      setIsPublic(false)
      toast({
        title: 'Caption Unposted',
        description: 'Your caption has been made private and is no longer visible to others.',
      })
    } catch (error) {
      console.error('Error unposting caption:', error)
      toast({
        title: 'Unpost Failed',
        description: 'Failed to unpost caption. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center w-full">
        {/* Display Bar (Dots) */}
        {totalCount > 1 && (
          <div className="flex items-center justify-center gap-1 mb-6">
            {Array.from({ length: totalCount }, (_, index) => (
              <div
                key={index}
                className={`w-${totalCount <= 10 ? 8 : totalCount <= 20 ? 4 : 2} 
                    h-1 rounded-full transition-colors duration-200 ${
                      index === currentIndex ? 'bg-primary' : inactiveDotClass
                    }`}
              />
            ))}
          </div>
        )}

        {/* Image with Navigation Arrows */}
        <div className="flex items-center justify-center w-full px-4 sm:px-6 md:px-8">
          {/* Left Arrow */}
          {onPrevious && (
            <button
              onClick={onPrevious}
              disabled={!hasPrevious}
              className={`flex items-center gap-2 px-3 sm:px-4 py-3 ${hoverBgClass} 
                     disabled:opacity-50 disabled:cursor-not-allowed rounded-lg 
                     transition-colors duration-200 flex-shrink-0 mr-2 sm:mr-4 md:mr-6`}
              aria-label="Previous caption"
            >
              <FaArrowLeft
                className={`w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 ${iconColorClass}`}
              />
            </button>
          )}

          {/* Image Container */}
          <div className="flex-1 flex items-center justify-center max-w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Caption image"
              className={imageClasses}
          />
          </div>

          {/* Right Arrow */}
          {onNext && (
            <button
              onClick={onNext}
              disabled={!hasNext}
              className={`flex items-center gap-2 px-3 sm:px-4 py-3 ${hoverBgClass} 
                     disabled:opacity-50 disabled:cursor-not-allowed rounded-lg 
                     transition-colors duration-200 flex-shrink-0 ml-2 sm:ml-4 md:ml-6`}
              aria-label="Next caption"
            >
              <FaArrowRight
                className={`w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 ${iconColorClass}`}
              />
            </button>
          )}
        </div>

        {/* Divider with centered logo */}
        <div className="w-full flex items-center px-4">
          <div className={`flex-1 h-px ${dividerClass}`} />
          <BrandImage variant="logo" alt="crack'd" className="h-16 w-16 sm:h-20 sm:w-20" />
          <div className={`flex-1 h-px ${dividerClass}`} />
        </div>

        {/* Caption text */}
        <p
          className={`text-center ${captionTextClass} text-base sm:text-lg leading-relaxed px-4 sm:px-6`}
        >
          {content}
        </p>

        {/* Actions row */}
        <div className="flex items-center w-full max-w-sm mt-6">
          {/* Left section - Bookmark button */}
          <div className="flex-1 flex justify-center">
            <div
              className={`rounded-full p-3 ${hoverBgClass} transition-colors 
                        duration-200 h-12 w-12 flex items-center justify-center`}
            >
              <BookmarkButton
                bookmarked={isSaved}
                onClick={() => {
                  setIsSaved(!isSaved)
                  onSave(id)
                }}
                size={30}
              />
            </div>
          </div>

          {/* Center section - Share button */}
          <div className="flex-1 flex justify-center">
            <div
              className={`rounded-full p-3 ${hoverBgClass} transition-colors 
                        duration-200 h-12 w-12 flex items-center justify-center`}
            >
              <ShareModal iconWidth={30} iconHeight={30} shareUrl={shareUrl} />
            </div>
          </div>

          {/* Right section - Post/Posted button */}
          <div className="flex-1 flex justify-end">
            {!isPublic && isOwner && (
              <button
                className={`rounded-lg transition-colors duration-200 w-24 
                            h-12 flex items-center justify-center ${
                              isPosting
                                ? 'bg-primary/50 text-primary-foreground/70 cursor-not-allowed'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                            }`}
                onClick={() => {
                  console.log('Post button clicked!', { id, isPosting, isPublic, isOwner })
                  handlePostCaption(id)
                }}
                disabled={isPosting}
                aria-label={isPosting ? 'Posting...' : 'Post'}
              >
                <span className="font-bold">{isPosting ? 'Posting...' : 'Post'}</span>
              </button>
            )}

            {isPublic && (
              <button
                onClick={() => {
                  if (isOwner) {
                    console.log('Unpost button clicked!', { id, isPosting, isPublic, isOwner })
                    handleUnpostCaption(id)
                  }
                }}
                disabled={isPosting || !isOwner}
                className={`rounded-lg w-24 h-12 flex items-center justify-center 
                  transition-colors duration-200 ${
                  isOwner
                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 cursor-pointer'
                    : 'bg-green-500/20 text-green-400 cursor-default'
                } ${isPosting ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label={isOwner ? 'Click to unpost' : 'Posted'}
              >
                <span className="font-bold text-sm">{isPosting ? 'Unposting...' : 'Posted'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

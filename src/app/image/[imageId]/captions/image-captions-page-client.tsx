'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import LoadingScreen from '@/components/LoadingScreen'
import { CaptionViewV2 } from '@/components/ui/caption-view-v2'
import { useToast } from '@/hooks/use-toast'
import { toggleCaptionSave } from '@/utils/toggle-caption-save'
import { loadSavedCaptionIds } from '@/utils/saved-caption-ids'
import { checkAuthStatusAction } from '@/app/actions/auth/check-auth-status'
import { fetchPopularCaptionsByImageIdAction, generateCaptions } from '@/app/actions/captions'
import type { Caption } from '@/utils/types'
import { buildCaptionShareUrl } from '@/utils/site-url'
import { useCaptionGeneration } from '@/hooks/useCaptionGeneration'
import {
  captionGenerationAvailability,
  GENERATION_BLOCK_MESSAGES,
  type GenerationBlock,
} from '@/utils/caption-generation-availability'

type ImageCaptionsPageClientProps = {
  imageId: string
  imageUrl: string
  isCommonUse: boolean
  maxCaptions?: number
  initialCaptions?: Caption[]
}

type PopularCaptionRow = {
  id: string
  image_id: string
  content: string
  is_public: boolean
  profile_id: string
  humor_flavor_id?: number | null
}

type GenerationResult =
  | { captions: Caption[]; reason: null; error: null }
  | { captions: null; reason: GenerationBlock | null; error: unknown }

const failureMessage = (result: Extract<GenerationResult, { captions: null }>) =>
  result.reason ? GENERATION_BLOCK_MESSAGES[result.reason]
    : result.error instanceof Error ? result.error.message : 'New captions couldn’t be generated.'

type GenerationOperation = ReturnType<ReturnType<typeof useCaptionGeneration>['begin']>

// Asks the caption API only when it is configured and has not already refused or failed.
// A failure is recorded and returned, never thrown, so existing captions stay on screen.
async function generateIfAvailable({ imageId, isCommonUse, operation, automatic, toast }: {
  imageId: string
  isCommonUse: boolean
  operation: GenerationOperation
  automatic: boolean
  toast: ReturnType<typeof useToast>['toast']
}): Promise<GenerationResult> {
  const availability = captionGenerationAvailability
  const gate = availability.check(imageId, { isCommonUse, automatic })
  if (!gate.ok) return { captions: null, reason: gate.reason, error: null }
  try {
    const captions = await generateCaptions(imageId, {
      ...operation,
      onPartialFailure: () => operation.isCurrent() && toast({
        title: 'Some captions are ready',
        description: 'Some humor flavors could not finish. Showing successful captions.',
      }),
    })
    availability.recordSuccess(imageId)
    return { captions, reason: null, error: null }
  } catch (error) {
    operation.signal.throwIfAborted()
    console.error('Caption generation unavailable:', error)
    return { captions: null, error,
      reason: availability.recordFailure(imageId, error, { isCommonUse }) }
  }
}

const normalizeCaption = (caption: PopularCaptionRow): Caption => ({
  id: caption.id,
  image_id: caption.image_id,
  content: caption.content,
  is_public: caption.is_public,
  profile_id: caption.profile_id,
  humor_flavor_id: caption.humor_flavor_id ?? undefined,
})

export function ImageCaptionsPageClient({
  imageId,
  imageUrl,
  isCommonUse,
  maxCaptions = 10,
  initialCaptions,
}: ImageCaptionsPageClientProps) {
  const [roasts, setRoasts] = useState<Caption[]>(initialCaptions ?? [])
  const { isLoading, progress, begin, cancel, continueBrowsing } = useCaptionGeneration()
  const [currentCaptionIndex, setCurrentCaptionIndex] = useState(0)
  const [bookmarkedCaptions, setBookmarkedCaptions] = useState<string[]>([])
  const [popularCaptions, setPopularCaptions] = useState<Caption[]>([])
  const [popularOffset, setPopularOffset] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  // Shown under the captions when new ones could not be added, or as the empty state.
  const [notice, setNotice] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const availability = captionGenerationAvailability
  // Existing captions are always shown; generation only adds to them when it can work.
  const canRequestMore = availability.check(imageId, { isCommonUse, automatic: false }).ok
  const tryGenerate = (operation: GenerationOperation, automatic: boolean) =>
    generateIfAvailable({ imageId, isCommonUse, operation, automatic, toast })

  const handleRoastAgain = async () => {
    const target = maxCaptions
    // Saved captions not shown yet come first; generation tops them up.
    const remaining = isCommonUse
      ? popularCaptions.slice(popularOffset, popularOffset + target) : []
    const show = (captions: Caption[], fromSaved: number) => {
      if (fromSaved) setPopularOffset(offset => offset + fromSaved)
      if (!captions.length) return
      setRoasts(prev => [...captions, ...prev])
      setCurrentCaptionIndex(0)
      setNotice(null)
    }
    if (remaining.length >= target) {
      show(remaining, remaining.length)
      return
    }
    const gate = availability.check(imageId, { isCommonUse, automatic: false })
    if (!gate.ok) {
      show(remaining, remaining.length)
      toast({
        title: remaining.length ? 'These are the last saved captions' : 'No more captions yet',
        description: GENERATION_BLOCK_MESSAGES[gate.reason],
      })
      return
    }

    const operation = begin(imageUrl)
    try {
      const result = await tryGenerate(operation, false)
      const captions = [...remaining, ...(result.captions ?? [])].slice(0, target)
      operation.complete(captions)
      if (!operation.isCurrent()) return
      show(captions, remaining.length)
      if (!result.captions) {
        toast({
          title: captions.length ? 'Showing saved captions' : 'No new captions',
          description: failureMessage(result),
        })
      }
    } catch (error) {
      operation.fail(error)
      if (!operation.isCurrent()) return
      console.error('Error generating more captions:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate captions.',
      })
    } finally {
      operation.finish()
    }
  }

  const handleSlideBookmark = (captionId: string) =>
    toggleCaptionSave({
      captionId,
      savedCaptions: bookmarkedCaptions,
      setSavedCaptions: setBookmarkedCaptions,
      toast,
    })

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const { userId: currentUserId } = await checkAuthStatusAction()
        setUserId(currentUserId)
      } catch (error) {
        console.error('Error loading user info:', error)
        setUserId(null)
      }
    }

    const loadBookmarkedCaptions = async () => {
      const bookmarkedIds = await loadSavedCaptionIds()
      setBookmarkedCaptions(bookmarkedIds)
    }

    loadUserInfo()
    loadBookmarkedCaptions()
  }, [])

  useEffect(() => {
    // A notification opens saved job results; only a fresh image starts generation.
    if (initialCaptions !== undefined) return

    const loadCaptions = async () => {
      setRoasts([])
      setCurrentCaptionIndex(0)
      setNotice(null)
      const gate = captionGenerationAvailability.check(imageId, { isCommonUse, automatic: true })
      // A private image has no saved captions to load, so there is nothing to wait for.
      if (!isCommonUse && !gate.ok) {
        setNotice(GENERATION_BLOCK_MESSAGES[gate.reason])
        return
      }
      const operation = begin(imageUrl)

      try {
        const target = maxCaptions
        let existing: Caption[] = []
        if (isCommonUse) {
          const popularCaptionsRaw = await fetchPopularCaptionsByImageIdAction(imageId)
          operation.signal.throwIfAborted()
          existing = (popularCaptionsRaw ?? []).map(normalizeCaption)
          if (operation.isCurrent()) setPopularCaptions(existing)
        }

        let captions = existing.slice(0, target)
        if (captions.length < target) {
          const result = await generateIfAvailable({
            imageId, isCommonUse, operation, automatic: true, toast,
          })
          if (result.captions) {
            captions = [...captions, ...result.captions].slice(0, target)
          } else if (operation.isCurrent() && (captions.length === 0
            || result.reason !== 'not-configured')) {
            // Keep the saved captions; explain quietly instead of showing an error.
            setNotice(captions.length
              ? `Showing ${captions.length} saved caption${captions.length === 1 ? '' : 's'}. `
                + failureMessage(result)
              : failureMessage(result))
          }
        }

        if (isCommonUse && operation.isCurrent()) {
          setPopularOffset(Math.min(existing.length, captions.length))
        }
        operation.complete(captions)
        if (!operation.isCurrent()) return
        setRoasts(captions)
      } catch (error) {
        operation.fail(error)
        if (!operation.isCurrent()) return
        console.error('Error loading captions:', error)
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load captions.',
        })
      } finally {
        operation.finish()
      }
    }

    void loadCaptions()
    return cancel
  }, [imageId, imageUrl, isCommonUse, maxCaptions, initialCaptions, toast, begin, cancel])

  return (
    <div className="w-full">
      {isLoading && <LoadingScreen onContinueBrowsing={continueBrowsing} job={progress} />}

      {!isLoading && roasts.length === 0 && (
        <div className="w-full max-w-[650px] mx-auto px-4 text-center text-muted-foreground">
          <p role="status">
            {notice ? `No captions for this image yet. ${notice}` : 'No captions to show yet.'}
          </p>
          {canRequestMore && (
            <button onClick={handleRoastAgain} className="mt-4 text-primary underline">
              {notice ? 'Try again' : 'Get captions'}
            </button>
          )}
        </div>
      )}

      {roasts.length > 0 && !isLoading && (
        <div className="w-full max-w-[650px] mx-auto px-4">
          <CaptionViewV2
            key={roasts[currentCaptionIndex].id}
            id={roasts[currentCaptionIndex].id}
            imageUrl={imageUrl}
            content={roasts[currentCaptionIndex].content}
            saved={bookmarkedCaptions.includes(roasts[currentCaptionIndex].id)}
            onSave={handleSlideBookmark}
            shareUrl={buildCaptionShareUrl(roasts[currentCaptionIndex].id)}
            isPublic={roasts[currentCaptionIndex].is_public}
            isOwner={roasts[currentCaptionIndex].profile_id === userId}
            onPrevious={() => setCurrentCaptionIndex(Math.max(0, currentCaptionIndex - 1))}
            onNext={() =>
              setCurrentCaptionIndex(Math.min(roasts.length - 1, currentCaptionIndex + 1))
            }
            hasPrevious={currentCaptionIndex > 0}
            hasNext={currentCaptionIndex < roasts.length - 1}
            currentIndex={currentCaptionIndex}
            totalCount={roasts.length}
            tone="auto"
          />

          {notice && (
            <p role="status" className="mb-3 text-center text-sm text-muted-foreground">
              {notice}
            </p>
          )}

          <div
            className="flex flex-row gap-2 sm:gap-4 justify-center items-center 
              w-full max-w-[650px] mx-auto flex-wrap"
          >
            <button
              onClick={handleRoastAgain}
              className="bg-primary/20 text-primary px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl 
                font-semibold hover:bg-primary/30 transition-colors duration-200 
                flex items-center gap-1.5 sm:gap-2 border border-primary text-sm sm:text-base 
                whitespace-nowrap"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 
                    8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Crack Again</span>
            </button>

            <button
              onClick={() => router.push('/new')}
              className="bg-primary/20 text-primary px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl 
                font-semibold hover:bg-primary/30 transition-colors duration-200 
                flex items-center gap-1.5 sm:gap-2 border border-primary text-sm sm:text-base 
                whitespace-nowrap"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Crack New Image</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

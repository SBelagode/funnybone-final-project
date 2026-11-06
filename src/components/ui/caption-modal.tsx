'use client'

import type { ReactNode } from 'react'
import { CaptionViewV2 } from '@/components/ui/caption-view-v2'
import { buildCaptionShareUrl } from '@/utils/site-url'

export type CaptionModalItem = {
  id: string
  content: string
  imageUrl: string
  isPublic?: boolean
  isOwner?: boolean
}

type CaptionModalProps = {
  items: CaptionModalItem[]
  currentIndex: number
  onClose: () => void
  onIndexChange: (index: number) => void
  savedCaptionIds: string[]
  onSave: (captionId: string) => void | Promise<void>
  actions?: ReactNode
  emptyState?: ReactNode
  wrapNavigation?: boolean
}

export function CaptionModal({
  items,
  currentIndex,
  onClose,
  onIndexChange,
  savedCaptionIds,
  onSave,
  actions,
  emptyState,
  wrapNavigation = false,
}: CaptionModalProps) {
  const safeIndex = Math.max(0, Math.min(currentIndex, items.length - 1))
  const current = items[safeIndex]
  const hasMultiple = items.length > 1
  const hasPrevious = wrapNavigation ? hasMultiple : safeIndex > 0
  const hasNext = wrapNavigation ? hasMultiple : safeIndex < items.length - 1

  const handlePrevious = () => {
    if (!hasMultiple) return
    const nextIndex = wrapNavigation
      ? safeIndex === 0
        ? items.length - 1
        : safeIndex - 1
      : Math.max(0, safeIndex - 1)
    onIndexChange(nextIndex)
  }

  const handleNext = () => {
    if (!hasMultiple) return
    const nextIndex = wrapNavigation
      ? safeIndex === items.length - 1
        ? 0
        : safeIndex + 1
      : Math.min(items.length - 1, safeIndex + 1)
    onIndexChange(nextIndex)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center items-center bg-black/80 backdrop-blur-sm cursor-pointer p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-3xl max-h-[calc(100vh-2rem)] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative flex flex-col items-center pt-4">
          {current ? (
            <>
              <CaptionViewV2
                id={current.id}
                imageUrl={current.imageUrl}
                content={current.content}
                saved={savedCaptionIds.includes(current.id)}
                onSave={onSave}
                shareUrl={buildCaptionShareUrl(current.id)}
                isPublic={current.isPublic ?? false}
                isOwner={current.isOwner ?? false}
                imageClassName="h-[50vh] w-auto max-w-full object-contain"
                onPrevious={hasMultiple ? handlePrevious : undefined}
                onNext={hasMultiple ? handleNext : undefined}
                hasPrevious={hasPrevious}
                hasNext={hasNext}
                currentIndex={safeIndex}
                totalCount={items.length}
              />
              {actions}
            </>
          ) : (
            emptyState ?? (
              <div className="text-center text-white">
                <p className="text-lg mb-4">No captions available.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

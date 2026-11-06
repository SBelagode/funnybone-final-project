import type { CaptionJobUpdate } from './caption-job-client'

export type CaptionGenerationNotice = {
  id: string
  title: string
  description: string
  jobId?: string
  imageId?: string
  captionIds?: string[]
  failed: boolean
}

// A task can outlive its page without allowing it to update that page's state.
export function createCaptionGenerationTask(
  notify: (notice: CaptionGenerationNotice) => void,
  onBackgroundChange?: (running: boolean) => void,
) {
  const controller = new AbortController()
  const id = crypto.randomUUID()
  let background = false
  let runningInBackground = false
  let notified = false
  let progress: CaptionJobUpdate | null = null
  let result: CaptionGenerationNotice | null = null

  const updateBackgroundState = () => {
    const running = background && !result && !controller.signal.aborted
    if (running === runningInBackground) return
    runningInBackground = running
    onBackgroundChange?.(running)
  }

  const publish = () => {
    updateBackgroundState()
    if (!background || !result || notified || controller.signal.aborted) return
    notified = true
    notify(result)
  }

  return {
    id,
    signal: controller.signal,
    cancel: () => {
      controller.abort()
      updateBackgroundState()
    },
    continueInBackground: () => {
      background = true
      publish()
    },
    onProgress: (job: CaptionJobUpdate) => { progress = job },
    complete: (captions: { id: string; image_id: string }[]) => {
      if (result || controller.signal.aborted || !captions.length) return
      const partial = progress?.status === 'partially_completed'
      result = {
        id,
        title: partial ? 'Your captions are ready — some flavors could not finish'
          : 'Your captions are ready!',
        description: partial ? 'The captions that succeeded are ready to view.'
          : 'Your captions have finished. Take a look!',
        jobId: progress?.jobId,
        imageId: captions[0].image_id,
        // The page may mix in popular captions or limit the number it displays.
        // Keep the full job result so the notification opens only this generation.
        captionIds: [...new Set(progress?.captionIds.length
          ? progress.captionIds : captions.map(caption => caption.id))],
        failed: false,
      }
      publish()
    },
    fail: (error: unknown) => {
      if (result || controller.signal.aborted) return
      result = {
        id,
        title: 'We couldn’t finish getting your captions',
        description: error instanceof Error ? error.message : 'Please try your image again.',
        failed: true,
      }
      publish()
    },
  }
}

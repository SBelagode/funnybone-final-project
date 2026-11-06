'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { CheckCircle2, AlertCircle, ImageIcon, LoaderCircle, X } from 'lucide-react'
import {
  createCaptionGenerationTask,
  type CaptionGenerationNotice,
} from '@/utils/caption-generation-task'

type Task = ReturnType<typeof createCaptionGenerationTask>
type RegisteredTask = Task & { finish: () => void }
export type CaptionGenerationImage = string | File
type ProgressNotice = { id: string; imageUrl?: string }
type CompletionNotice = CaptionGenerationNotice & { imageUrl?: string }
const CaptionGenerationContext = createContext<
  ((image?: CaptionGenerationImage) => RegisteredTask) | null
>(null)

function CaptionImageThumbnail({ imageUrl, alt }: {
  imageUrl?: string
  alt: string
}) {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden
      rounded-md border border-border bg-muted">
      {imageUrl && !imageFailed ? (
        // Local uploads use a blob URL before a hosted image is available.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <>
          <ImageIcon className="h-6 w-6 text-muted-foreground" aria-hidden />
          <span className="sr-only">Image preview unavailable</span>
        </>
      )}
    </div>
  )
}

function CaptionProgressNotice({ notice, onDismiss }: {
  notice: ProgressNotice
  onDismiss: () => void
}) {
  return (
    <article
      aria-atomic="true"
      className="pointer-events-auto relative rounded-xl border border-primary/30
        bg-background p-4 pr-12 text-foreground shadow-xl animate-in slide-in-from-right
        fade-in duration-300"
    >
      <div className="flex items-center gap-3">
        <CaptionImageThumbnail imageUrl={notice.imageUrl} alt="Image being captioned" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="shrink-0 animate-spin text-primary">
              <LoaderCircle className="h-4 w-4" aria-hidden />
            </span>
            <h2 className="text-sm font-semibold">Creating your captions…</h2>
          </div>
          <div
            role="progressbar"
            aria-label="Caption generation in progress"
            className="mt-3 h-1 overflow-hidden rounded-full bg-primary/15"
          >
            <div className="h-full animate-shimmer bg-gradient-to-r from-transparent
              via-primary to-transparent" />
          </div>
        </div>
      </div>
      <button
        type="button"
        aria-label="Dismiss caption progress notification"
        onClick={onDismiss}
        className="absolute right-2 top-2 rounded-md p-2 text-muted-foreground
          hover:bg-muted hover:text-foreground focus-visible:outline-none
          focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </article>
  )
}

export function CaptionGenerationProvider({ children }: { children: ReactNode }) {
  const tasks = useRef(new Set<RegisteredTask>())
  const previewUrls = useRef(new Map<string, string>())
  const [progressNotices, setProgressNotices] = useState<ProgressNotice[]>([])
  const [notices, setNotices] = useState<CompletionNotice[]>([])
  const releasePreview = useCallback((id: string) => {
    const url = previewUrls.current.get(id)
    if (!url) return
    previewUrls.current.delete(id)
    URL.revokeObjectURL(url)
  }, [])
  const dismissNotice = (id: string) => {
    releasePreview(id)
    setNotices(previous => previous.filter(notice => notice.id !== id))
  }

  const createTask = useCallback((image?: CaptionGenerationImage): RegisteredTask => {
    const objectUrl = image && typeof image !== 'string' ? URL.createObjectURL(image) : undefined
    const imageUrl = typeof image === 'string' ? image : objectUrl
    let previewInNotice = false
    const task = createCaptionGenerationTask(
      notice => {
        // Successful background jobs keep their preview until the notice is dismissed.
        previewInNotice = !notice.failed
        const completionNotice = { ...notice, imageUrl: previewInNotice ? imageUrl : undefined }
        setNotices(previous => [...previous, completionNotice])
      },
      running => setProgressNotices(previous => running
        ? [...previous, { id: task.id, imageUrl }]
        : previous.filter(notice => notice.id !== task.id)),
    )
    const finish = () => {
      if (!tasks.current.delete(registeredTask)) return
      if (!previewInNotice) releasePreview(task.id)
    }
    const registeredTask: RegisteredTask = {
      ...task,
      finish,
      cancel: () => { task.cancel(); finish() },
    }
    if (objectUrl) previewUrls.current.set(task.id, objectUrl)
    tasks.current.add(registeredTask)
    return registeredTask
  }, [releasePreview])

  useEffect(() => {
    const running = tasks.current
    const previews = previewUrls.current
    return () => {
      running.forEach(task => task.cancel())
      running.clear()
      previews.forEach(url => URL.revokeObjectURL(url))
      previews.clear()
    }
  }, [])

  return (
    <CaptionGenerationContext.Provider value={createTask}>
      {children}
      <section
        aria-label="Caption notifications"
        aria-live="polite"
        aria-relevant="additions text"
        className="pointer-events-none fixed bottom-4 right-4 z-[110] flex max-h-[calc(100dvh-2rem)]
          w-[calc(100%-2rem)] max-w-sm flex-col gap-3 overflow-y-auto"
      >
        {progressNotices.map(notice => (
          <CaptionProgressNotice
            key={notice.id}
            notice={notice}
            onDismiss={() => setProgressNotices(previous =>
              previous.filter(item => item.id !== notice.id))}
          />
        ))}
        {notices.map(notice => (
          <article
            key={notice.id}
            aria-atomic="true"
            className="pointer-events-auto relative rounded-xl border border-primary/30
              bg-background p-5 pr-12 text-foreground shadow-xl animate-in slide-in-from-right
              fade-in duration-300"
          >
            <div className="flex items-start gap-3">
              {notice.failed ? (
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden />
              ) : (
                <CaptionImageThumbnail
                  imageUrl={notice.imageUrl}
                  alt="Image used for these captions"
                />
              )}
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-start gap-2">
                  {!notice.failed && (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  )}
                  <h2 className="text-sm font-semibold">{notice.title}</h2>
                </div>
                <p className="text-sm text-muted-foreground">{notice.description}</p>
                {notice.imageId && notice.captionIds && notice.captionIds.length > 0 && (
                  <Link
                    href={notice.jobId ? `/caption-job/${notice.jobId}` : {
                      pathname: `/image/${notice.imageId}/captions`,
                      query: { captionIds: notice.captionIds.join(',') },
                    }}
                    onClick={() => dismissNotice(notice.id)}
                    className="inline-block rounded text-sm font-semibold text-primary underline
                      underline-offset-4 focus-visible:outline-none focus-visible:ring-2
                      focus-visible:ring-ring"
                  >
                    View captions
                  </Link>
                )}
              </div>
            </div>
            <button
              type="button"
              aria-label="Dismiss caption notification"
              onClick={() => dismissNotice(notice.id)}
              className="absolute right-2 top-2 rounded-md p-2 text-muted-foreground
                hover:bg-muted hover:text-foreground focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </article>
        ))}
      </section>
    </CaptionGenerationContext.Provider>
  )
}

export function useCaptionGenerationTask() {
  const createTask = useContext(CaptionGenerationContext)
  if (!createTask) throw new Error('CaptionGenerationProvider is missing.')
  return createTask
}

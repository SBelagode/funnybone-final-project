'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  useCaptionGenerationTask,
  type CaptionGenerationImage,
} from '@/components/caption-generation-provider'
import type { CaptionJobUpdate } from '@/utils/caption-job-client'

export function useCaptionGeneration() {
  const createTask = useCaptionGenerationTask()
  const active = useRef<ReturnType<typeof createTask> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<CaptionJobUpdate | null>(null)

  const cancel = useCallback(() => {
    active.current?.cancel()
    active.current?.finish()
    active.current = null
    setIsLoading(false)
    setProgress(null)
  }, [])

  useEffect(() => () => {
    active.current?.cancel()
    active.current?.finish()
    active.current = null
  }, [])

  const continueBrowsing = useCallback(() => {
    active.current?.continueInBackground()
    // Unmount cleanup only owns foreground work; the provider retains this task.
    active.current = null
    setIsLoading(false)
    setProgress(null)
  }, [])

  const begin = useCallback((image?: CaptionGenerationImage) => {
    active.current?.cancel()
    active.current?.finish()
    const task = createTask(image)
    active.current = task
    setIsLoading(true)
    setProgress(null)
    const isCurrent = () => active.current === task && !task.signal.aborted
    return {
      signal: task.signal,
      isCurrent,
      onProgress: (job: CaptionJobUpdate) => {
        task.onProgress(job)
        if (isCurrent()) setProgress(job)
      },
      complete: task.complete,
      fail: task.fail,
      finish: () => {
        task.finish()
        if (!isCurrent()) return
        active.current = null
        setIsLoading(false)
      },
    }
  }, [createTask])

  return { isLoading, progress, begin, cancel, continueBrowsing }
}

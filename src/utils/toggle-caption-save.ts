import { deleteSaveAction, insertSaveAction } from '@/app/actions/captions'
import type { Dispatch, SetStateAction } from 'react'
type ToastFn = (opts: { title: string; description: string }) => void

export async function toggleCaptionSave(opts: {
  captionId: string,
  savedCaptions: string[],
  setSavedCaptions: Dispatch<SetStateAction<string[]>>,
  toast: ToastFn,
}) {
  const { captionId, savedCaptions, setSavedCaptions, toast } = opts
  const originalState = savedCaptions
  const isSaved = savedCaptions.includes(captionId)

  try {
    if (isSaved) {
      setSavedCaptions((prev) => prev.filter((id) => id !== captionId))
      await deleteSaveAction(captionId)
    } else {
      setSavedCaptions((prev) => [...prev, captionId])
      await insertSaveAction(captionId)
    }
  } catch (error) {
    console.error('Error saving/unsaving caption:', error)
    setSavedCaptions(originalState)
    toast?.({
      title: 'Error',
      description: 'An error occurred while saving/unsaving the caption.',
    })
  }
}

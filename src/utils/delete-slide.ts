import { deleteImageAction } from '@/app/actions/images/delete-image'
import { deleteCaptionsByImageAction } from '@/app/actions/captions/delete-captions-by-image';
import type { Dispatch, SetStateAction } from 'react'
import type { ImageWithCaptions } from '@/utils/types'

type ToastFn = (opts: { title: string; description: string }) => void

export async function deleteSlide(opts: {
  imageUrl: string
  isCommunity: boolean
  communityImages: ImageWithCaptions[]
  setCommunityImages: Dispatch<SetStateAction<ImageWithCaptions[]>>
  setUserImages: Dispatch<SetStateAction<ImageWithCaptions[]>>
  closeCarousel: () => void
  toast: ToastFn
}) {
  const {
    imageUrl,
    isCommunity,
    communityImages,
    setCommunityImages,
    setUserImages,
    closeCarousel,
    toast,
  } = opts

  try {
    if (isCommunity) {
      // Just remove captions from UI
      const image = communityImages.find((img) => img.url === imageUrl)
      if (image) {
        await deleteCaptionsByImageAction(image.id)
        setCommunityImages((prev) => prev.filter((img) => img.id !== image.id))
      }
      toast({
        title: 'Deleted',
        description: 'Your captions were removed from this community image.',
      })
    } else {
      // Delete image from Supabase
      await deleteImageAction(imageUrl)
      setUserImages((prev) => prev.filter((img) => img.url !== imageUrl))
      toast({
        title: 'Deleted',
        description: 'Your uploaded image and captions have been deleted.',
      })
    }

    closeCarousel()
  } catch (error) {
    console.error('Delete failed:', error)
    toast({
      title: 'Error',
      description: 'Failed to delete image or captions.',
    })
  }
}

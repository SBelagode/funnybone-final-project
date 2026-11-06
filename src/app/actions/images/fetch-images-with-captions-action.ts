'use server'

import { createClient } from '@/utils/supabase/server'

const chunkArray = <T,>(items: T[], size: number): T[][] => {
  if (size <= 0) {
    return [items]
  }
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

export const fetchImagesWithCaptionsAction = async () => {
  const supabase = await createClient()
  const maxIdsPerBatch = 50

  // Get the current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not found.')
  }

  let allImages: any[] = []
  const pageSize = 100 // Adjust the page size as needed
  const imageSelectFields = [
    'id',
    'url',
    'created_datetime_utc',
    'modified_datetime_utc',
    'image_description',
    'additional_context',
    'celebrity_recognition',
  ]
  const fallbackImageFields = [
    'id',
    'url',
    'created_datetime_utc',
    'modified_datetime_utc',
    'image_description',
  ]
  const captionSelectFields =
    'id, content, image_id, is_public, profile_id, created_datetime_utc' as const

  const shouldSortCaptions = (captions: any[]) =>
    captions.some((caption) => caption?.created_datetime_utc)

  const sortCaptions = (captions: any[]) => {
    if (!shouldSortCaptions(captions)) {
      return captions
    }
    return [...captions].sort((a, b) => {
      const aTime = new Date(a.created_datetime_utc ?? 0).getTime()
      const bTime = new Date(b.created_datetime_utc ?? 0).getTime()
      return bTime - aTime
    })
  }

  const normalizeCaptions = (image: any) => ({
    ...image,
    captions: sortCaptions(Array.isArray(image?.captions) ? image.captions : []),
  })

  const buildSelect = (fields: string[], includeCaptions: boolean) =>
    includeCaptions
      ? `${fields.join(', ')}, captions (${captionSelectFields})`
      : fields.join(', ')

  const fetchImagesPage = async (
    fields: string[],
    pageIndex: number,
    includeCaptions: boolean
  ) =>
    supabase
      .from('images')
      .select(buildSelect(fields, includeCaptions))
      .eq('profile_id', user.id)
      .order('created_datetime_utc', { ascending: false })
      .range(pageIndex * pageSize, (pageIndex + 1) * pageSize - 1)

  const fetchAllImages = async (includeCaptions: boolean) => {
    const images: any[] = []
    let imageFields = imageSelectFields
    let usingFallbackFields = false
    let pageIndex = 0

    while (true) {
      let { data: pageImages, error: imagesError } = await fetchImagesPage(
        imageFields,
        pageIndex,
        includeCaptions
      )

      if (imagesError && !usingFallbackFields) {
        console.warn(
          'Primary images query failed, retrying with fallback fields:',
          imagesError.message
        )
        usingFallbackFields = true
        imageFields = fallbackImageFields
        const fallbackResult = await fetchImagesPage(
          imageFields,
          pageIndex,
          includeCaptions
        )
        pageImages = fallbackResult.data
        imagesError = fallbackResult.error
      }

      if (imagesError) {
        console.error('Error fetching images:', imagesError.message)
        throw new Error('Failed to fetch images.')
      }

      if (!pageImages || pageImages.length === 0) {
        break
      }

      const normalizedImages = includeCaptions
        ? pageImages.map(normalizeCaptions)
        : pageImages

      images.push(...normalizedImages)
      pageIndex += 1

      if (pageImages.length < pageSize) {
        break
      }
    }

    return images
  }

  const fetchCaptionsByImageIds = async (imageIds: string[]) => {
    const captionsByImageId = new Map<string, any[]>()
    if (imageIds.length === 0) {
      return captionsByImageId
    }

    const imageChunks = chunkArray(imageIds, maxIdsPerBatch)
    for (const chunk of imageChunks) {
      let captionPage = 0
      while (true) {
        const { data: captions, error: captionsError } = await supabase
          .from('captions')
          .select(captionSelectFields)
          .in('image_id', chunk)
          .order('created_datetime_utc', { ascending: false })
          .range(captionPage * pageSize, (captionPage + 1) * pageSize - 1)

        if (captionsError) {
          console.error('Error fetching captions:', captionsError.message)
          throw new Error('Failed to fetch captions.')
        }

        if (!captions || captions.length === 0) {
          break
        }

        for (const caption of captions) {
          const imageId = caption?.image_id
          if (!imageId) {
            continue
          }
          const existing = captionsByImageId.get(imageId)
          if (existing) {
            existing.push(caption)
          } else {
            captionsByImageId.set(imageId, [caption])
          }
        }

        captionPage += 1
        if (captions.length < pageSize) {
          break
        }
      }
    }

    return captionsByImageId
  }

  try {
    allImages = await fetchAllImages(true)
    return allImages
  } catch (error) {
    console.warn('Nested captions query failed, retrying with separate captions:', error)
  }

  allImages = await fetchAllImages(false)
  if (allImages.length === 0) {
    return []
  }

  const imageIds = Array.from(
    new Set(allImages.map((image: any) => image.id).filter(Boolean))
  )
  const captionsByImageId = await fetchCaptionsByImageIds(imageIds)

  return allImages.map((image: any) => ({
    ...image,
    captions: sortCaptions(captionsByImageId.get(image.id) ?? []),
  }))
}

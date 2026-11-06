'use server'

import { createClient } from '@/utils/supabase/server'

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

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

export const fetchSavedCaptionsAction = async () => {
  const supabase = await createClient()
  const maxIdsPerBatch = 200

  // Anonymous users can still view pages that render saved state.
  // In that case there are simply no saved captions to return.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  // Fetch the saved captions for the current user by their profile_id
  const { data: savedCaptions, error } = await supabase
    .from('caption_saves')
    .select('caption_id')
    .order('created_datetime_utc', { ascending: false })
    .eq('profile_id', user.id)

  if (error) {
    console.error('Error fetching saved captions:', error.message)
    throw new Error('Failed to fetch saved captions.')
  }

  // If no saved captions, return empty array
  if (!savedCaptions || savedCaptions.length === 0) {
    return []
  }

  // Fetch the captions corresponding to the saved caption_ids
  const captionIds = savedCaptions.map((save: any) => save.caption_id)

  // Validate that we have valid caption IDs and filter out invalid UUIDs
  if (!captionIds || captionIds.length === 0) {
    return []
  }

  // Filter out invalid UUIDs to prevent database errors
  const validCaptionIds = captionIds.filter((id: any) => id && isValidUUID(id))

  if (validCaptionIds.length === 0) {
    console.warn('No valid UUID caption IDs found, returning empty array')
    return []
  }

  const imageSelectFields = [
    'id',
    'url',
    'image_description',
    'additional_context',
    'celebrity_recognition',
  ]
  const fallbackFields = ['id', 'url', 'image_description']
  const captionSelectFields = ['id', 'content', 'image_id', 'created_datetime_utc']

  const buildCaptionsSelect = (fields?: string[]) => {
    const imageSelect = fields?.length ? `, images ( ${fields.join(', ')} )` : ''
    return `${captionSelectFields.join(', ')}${imageSelect}`
  }

  const fetchCaptions = async (fields?: string[]) => {
    const captionChunks = chunkArray(validCaptionIds, maxIdsPerBatch)
    const allCaptions: any[] = []

    for (const chunk of captionChunks) {
      const { data, error } = await supabase
        .from('captions')
        .select(buildCaptionsSelect(fields))
        .in('id', chunk)
        .order('created_datetime_utc', { ascending: false })

      if (error) {
        return { data: null, error }
      }

      if (data && data.length > 0) {
        allCaptions.push(...data)
      }
    }

    return { data: allCaptions, error: null }
  }

  const fetchImagesByIds = async (ids: string[], fields: string[]) => {
    const imageChunks = chunkArray(ids, maxIdsPerBatch)
    const allImages: any[] = []

    for (const chunk of imageChunks) {
      const { data, error } = await supabase
        .from('images')
        .select(fields.join(', '))
        .in('id', chunk)

      if (error) {
        return { data: null, error }
      }

      if (data && data.length > 0) {
        allImages.push(...data)
      }
    }

    return { data: allImages, error: null }
  }

  // Get the actual captions using only valid UUIDs
  let captions: any[] = []
  let usedSeparateImages = false
  const { data: captionsData, error: captionsError } = await fetchCaptions(imageSelectFields)

  if (captionsError) {
    console.error('Error fetching captions:', captionsError.message)
    const { data: fallbackData, error: fallbackError } = await fetchCaptions(fallbackFields)
    if (fallbackError) {
      console.error('Error fetching captions:', fallbackError.message)
      const { data: minimalData, error: minimalError } = await fetchCaptions()
      if (minimalError) {
        console.error('Error fetching captions:', minimalError.message)
        throw new Error('Failed to fetch captions.')
      }
      captions = minimalData || []
      usedSeparateImages = true
    } else {
      captions = fallbackData || []
    }
  } else {
    captions = captionsData || []
  }

  // If no captions found, return empty array
  if (!captions || captions.length === 0) {
    return []
  }

  captions.sort(
    (a, b) =>
      new Date(b.created_datetime_utc).getTime() -
      new Date(a.created_datetime_utc).getTime()
  )

  let imagesById = new Map<string, any>()
  if (usedSeparateImages) {
    const imageIds = Array.from(
      new Set(captions.map((caption: any) => caption.image_id).filter(Boolean))
    )

    if (imageIds.length > 0) {
      let { data: imagesData, error: imagesError } = await fetchImagesByIds(
        imageIds,
        imageSelectFields
      )

      if (imagesError) {
        console.warn('Error fetching images:', imagesError.message)
        const fallbackImages = await fetchImagesByIds(imageIds, fallbackFields)
        imagesData = fallbackImages.data
        imagesError = fallbackImages.error
      }

      if (imagesError) {
        console.error('Error fetching images:', imagesError.message)
      } else if (imagesData) {
        imagesById = new Map(imagesData.map((image: any) => [image.id, image]))
      }
    }
  }

  // Map the captions to include their associated image URLs
  const captionsWithImages = captions.map((caption: any) => {
    const image = usedSeparateImages
      ? imagesById.get(caption.image_id)
      : Array.isArray(caption.images)
        ? caption.images[0]
        : caption.images
    const rest = { ...caption }
    if (usedSeparateImages && rest.images === undefined) {
      rest.images = image ?? null
    }
    return {
      ...rest,
      image_url: image?.url || '/placeholder.svg',
      image_description: image?.image_description ?? null,
      image_additional_context: image?.additional_context ?? null,
      image_celebrity_recognition: image?.celebrity_recognition ?? null,
    }
  })

  return captionsWithImages
}

'use server'

import { createClient } from '@/utils/supabase/server'

export const fetchPopularCaptionsByImageIdAction = async (
    imageId: string,
) => {
  const supabase = await createClient()

  const { data: captions, error } = await supabase
    .from('captions')
    .select(
      `
      id,
      image_id,
      content,
      is_public,
      profile_id,
      humor_flavor_id,
      created_datetime_utc,
      like_count,
      images!inner (
        id,
        url,
        is_common_use
      )
    `
    )
    .eq('image_id', imageId)
    .order('like_count', { ascending: false })
    .order('created_datetime_utc', { ascending: false })
    .order('id', { ascending: false })

  if (error) {
    console.error('Error fetching popular captions for common-use image:', error)
    throw new Error('Failed to fetch popular captions for common-use image')
  }

  if (!captions) {
    return []
  }

  return captions
}

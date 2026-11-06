'use server'

import { createClient } from '@/utils/supabase/server'

type Period = 'all' | 'year' | 'past30' | 'week'

export const fetchPopularCaptionsAction = async (limit = 100, period: Period = 'all') => {
  const supabase = await createClient()

  // Build date filter based on period
  let query = supabase
    .from('captions')
    .select(
      `
      id,
      content,
      created_datetime_utc,
      image_id,
      like_count,
      images!inner (
        id,
        url,
        is_common_use,
        is_public
      )
    `
    )
    .eq('images.is_public', true)
    .eq('is_public', true)
    .gt('like_count', 0)
    .order('like_count', { ascending: false })
    .eq('is_public', true)
    .order('created_datetime_utc', { ascending: false })
    .limit(limit)

  if (period !== 'all') {
    const now = new Date()
    const since = new Date(now)
    if (period === 'year') {
      since.setFullYear(now.getFullYear() - 1)
    } else if (period === 'past30') {
      since.setDate(now.getDate() - 30)
    } else if (period === 'week') {
      since.setDate(now.getDate() - 7)
    }
    query = query.gte('created_datetime_utc', since.toISOString())
  }

  const { data: captions, error } = await query

  if (error) {
    console.error('Error fetching popular captions:', error)
    throw new Error('Failed to fetch popular captions')
  }

  if (!captions) {
    return []
  }

  type PopularCaptionRow = {
    id: string
    content: string | null
    image_id: string | null
    like_count: number | null
    created_datetime_utc: string
    images?: {
      url?: string | null
      is_common_use?: boolean | null
      is_public?: boolean | null
    } | null
  }

  // Map captions with like_count from database
  const captionsWithVotes = (captions as PopularCaptionRow[]).map((caption) => ({
    id: caption.id,
    content: caption.content ?? '',
    image_id: caption.image_id ?? '',
    image_url: caption.images?.url ?? '',
    like_count: caption.like_count || 0, // Use like_count column from database
    is_common_use: caption.images?.is_common_use ?? false,
    created_at: caption.created_datetime_utc,
  }))

  // Sort by vote count (like_count) descending, then by date
  captionsWithVotes.sort((a, b) => {
    if (b.like_count !== a.like_count) {
      return b.like_count - a.like_count
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return captionsWithVotes
}

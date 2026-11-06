import { notFound, redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'
import type { Database } from '@/types/supabase'
import type { Caption } from '@/utils/types'
import { ImageCaptionsPageClient } from './image-captions-page-client'

type Props = {
  params: Promise<{
    imageId: string
  }>
  searchParams: Promise<{ captionIds?: string | string[] }>
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function ImageCaptionsPage({ params, searchParams }: Props) {
  const { imageId } = await params
  const { captionIds: requestedIds } = await searchParams
  let captionIds: string[] | undefined
  if (requestedIds !== undefined) {
    if (typeof requestedIds !== 'string') return notFound()
    captionIds = [...new Set(requestedIds.split(','))]
    if (!captionIds.every(id => uuid.test(id))) return notFound()
  }
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  if (user.app_metadata?.provider === 'anonymous' || user.is_anonymous) {
    return redirect('/login')
  }

  const { data: image, error } = await supabase
    .from('images')
    .select('id, url, is_common_use')
    .eq('id', imageId)
    .single()

  if (error) {
    console.error('Error loading image:', error)
    return notFound()
  }

  if (!image) {
    return notFound()
  }

  let initialCaptions: Caption[] | undefined
  if (captionIds) {
    const captions = new Map<string, Caption>()
    for (let offset = 0; offset < captionIds.length; offset += 100) {
      const { data, error: captionsError } = await supabase
        .from('captions')
        .select('id,image_id,content,is_public,profile_id,humor_flavor_id')
        .eq('image_id', imageId)
        .in('id', captionIds.slice(offset, offset + 100))

      if (captionsError) throw new Error('Unable to load your captions. Please try again.')
      for (const caption of (data ?? []) as Database['public']['Tables']['captions']['Row'][]) {
        captions.set(caption.id, {
          id: caption.id,
          image_id: caption.image_id,
          content: caption.content ?? '',
          is_public: caption.is_public,
          profile_id: caption.profile_id,
          humor_flavor_id: caption.humor_flavor_id ?? undefined,
        })
      }
    }
    if (captionIds.some(id => !captions.has(id))) return notFound()
    initialCaptions = captionIds.map(id => captions.get(id)!)
  }

  return (
    <ImageCaptionsPageClient
      key={`${image.id}:${captionIds?.join(',') ?? 'generate'}`}
      imageId={image.id}
      imageUrl={image.url}
      isCommonUse={image.is_common_use}
      initialCaptions={initialCaptions}
    />
  )
}

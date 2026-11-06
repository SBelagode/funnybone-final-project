import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'
import type { Caption } from '@/utils/types'
import type { Database } from '@/types/supabase'
import type { CaptionJobUpdate } from '@/utils/caption-job-client'
import { ImageCaptionsPageClient } from '@/app/image/[imageId]/captions/image-captions-page-client'

type Props = { params: Promise<{ jobId: string }> }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function CaptionJobPage({ params }: Props) {
  const { jobId } = await params
  if (!uuid.test(jobId)) return notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous || user.app_metadata?.provider === 'anonymous') {
    return redirect('/login')
  }
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token || session.user.id !== user.id) return redirect('/login')

  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  if (!apiUrl) throw new Error('API base URL is not defined.')
  const response = await fetch(`${apiUrl.replace(/\/+$/, '')}/pipeline/caption-job/${jobId}`, {
    method: 'GET',
    cache: 'no-store',
    headers: { Authorization: `Bearer ${session.access_token}` },
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) {
    await response.body?.cancel()
    if (response.status === 401) return redirect('/login')
    if (response.status === 403 || response.status === 404) return notFound()
    throw new Error('Unable to load this caption job. Please try again.')
  }

  const job: CaptionJobUpdate = await response.json()
  if (job?.jobId !== jobId
    || !['queued', 'running', 'completed', 'partially_completed', 'failed'].includes(job.status)
    || !Array.isArray(job.captionIds)
    || !job.captionIds.every(id => typeof id === 'string' && uuid.test(id))) {
    throw new Error('The caption job response was invalid.')
  }

  if (job.status === 'queued' || job.status === 'running') {
    return (
      <div className="mx-auto max-w-[650px] space-y-3 px-4 py-8 text-center">
        <h1 className="text-xl font-semibold">Your captions are still being created</h1>
        <p className="text-muted-foreground">Refresh this page in a moment to see your captions.</p>
      </div>
    )
  }
  if (job.status === 'failed' || job.captionIds.length === 0) {
    return (
      <div className="mx-auto max-w-[650px] space-y-3 px-4 py-8 text-center">
        <h1 className="text-xl font-semibold">No captions are available for this job</h1>
        <Link href="/new" className="text-primary underline">Create captions</Link>
      </div>
    )
  }

  const captionIds = [...new Set(job.captionIds)]
  const captions = new Map<string, Caption>()
  for (let offset = 0; offset < captionIds.length; offset += 100) {
    const { data, error } = await supabase
      .from('captions')
      .select('id,image_id,content,is_public,profile_id,humor_flavor_id')
      .in('id', captionIds.slice(offset, offset + 100))
    if (error) throw new Error('Unable to load your captions. Please try again.')
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
  const initialCaptions = captionIds.map(id => captions.get(id)!)
  const imageId = initialCaptions[0].image_id
  if (initialCaptions.some(caption => caption.image_id !== imageId)) return notFound()

  const { data: image, error } = await supabase
    .from('images')
    .select('id,url,is_common_use')
    .eq('id', imageId)
    .single()
  if (error || !image) return notFound()

  return (
    <ImageCaptionsPageClient
      key={jobId}
      imageId={image.id}
      imageUrl={image.url}
      isCommonUse={image.is_common_use}
      initialCaptions={initialCaptions}
    />
  )
}

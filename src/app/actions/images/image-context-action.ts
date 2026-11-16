'use server'

import { fetchCaptionApiState, type CaptionApiState } from '@/utils/caption-api-state'
import {
  combineContext,
  normalizeContext,
  REFINEMENT_MODES,
  type RefinementMode,
} from '@/utils/context-refinement'
import { verifiedAccessToken } from '@/utils/access-token'
import { createClient } from '@/utils/supabase/server'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isNudgePersistenceEnabled = () => process.env.ENABLE_NUDGE_PERSISTENCE === 'true'

export type ImageContextInfo =
  | {
    ok: true
    context: string | null
    // False keeps the panel on "Keep existing context", the behavior before refinement.
    refinement: boolean
    activeJob: boolean
    notice: string | null
  }
  | { ok: false; error: string }

export type ImageContextRequest = { mode: RefinementMode; text?: string; expected: string | null }
export type ImageContextResult =
  | { ok: true; context: string | null }
  | {
    ok: false
    error: string
    code: 'unavailable' | 'invalid' | 'not-found' | 'conflict' | 'busy' | 'failed'
    current?: string | null
  }

const NOT_FOUND = 'We couldn’t find this image on your account, so its context can’t change.'
const UNSUPPORTED = 'The caption service can’t use a changed context yet, so only '
  + '“Keep existing context” is available.'
const BUSY = 'Captions are still being generated for this image. Wait for them to finish, '
  + 'then try again.'
const CONFLICT = 'This image’s context changed somewhere else. Review the saved context and '
  + 'try again.'
const failed = (error: string, code: Extract<ImageContextResult, { ok: false }>['code']) =>
  ({ ok: false, error, code }) as const

// Signed-in, non-anonymous user only. Every query below also filters by owner and excludes
// shared images, so bangers and other users' images are never read or changed here.
async function signedIn() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous || user.app_metadata?.provider === 'anonymous') return null
  return { supabase, user }
}

async function readOwnImage(session: NonNullable<Awaited<ReturnType<typeof signedIn>>>,
  imageId: string) {
  const { data, error } = await session.supabase
    .from('images')
    .select('id, additional_context')
    .eq('id', imageId)
    .eq('profile_id', session.user.id)
    .not('is_common_use', 'is', true)
    .maybeSingle()
  // Log only the code: details can quote the row, including the context.
  if (error) console.error('Error reading image context:', error.code)
  return { row: data, error }
}

async function apiState(session: NonNullable<Awaited<ReturnType<typeof signedIn>>>,
  imageId: string): Promise<CaptionApiState | null> {
  try {
    // The user was verified with getUser(); the token must belong to that same user.
    const token = await verifiedAccessToken(session.supabase as never)
    if (!token.ok || token.userId !== session.user.id) return null
    return await fetchCaptionApiState(imageId, token.accessToken)
  } catch {
    return null
  }
}

export async function getImageContextAction(imageId: string): Promise<ImageContextInfo> {
  if (typeof imageId !== 'string' || !uuid.test(imageId)) {
    return { ok: false, error: 'This image could not be found.' }
  }
  const session = await signedIn()
  if (!session) return { ok: false, error: 'Please sign in again to generate captions.' }
  const { row, error } = await readOwnImage(session, imageId)
  if (error) return { ok: false, error: 'We couldn’t load this image’s context. Please try again.' }
  if (!row) return { ok: false, error: NOT_FOUND }

  const context = normalizeContext(row.additional_context)
  if (!isNudgePersistenceEnabled()) {
    return { ok: true, context, refinement: false, activeJob: false,
      notice: 'Changing context is turned off, so only “Keep existing context” is available.' }
  }
  const state = await apiState(session, imageId)
  if (!state) {
    return { ok: true, context, refinement: false, activeJob: false,
      notice: 'We couldn’t check the caption service, so only “Keep existing context” is '
        + 'available.' }
  }
  if (!state.supportsContextSnapshots) {
    return { ok: true, context, refinement: false, activeJob: false, notice: UNSUPPORTED }
  }
  return { ok: true, context, refinement: true, activeJob: state.activeJob,
    notice: state.activeJob ? BUSY : null }
}

// Saves the context for the next Crack Again, and returns the exact context that generation
// must send. Failures are returned, not thrown: Next.js hides thrown messages in production.
export async function updateImageContextAction(
  imageId: string,
  request: ImageContextRequest,
): Promise<ImageContextResult> {
  if (!isNudgePersistenceEnabled()) {
    return failed('Changing context is turned off right now. Nothing was saved, and no '
      + 'captions were generated.', 'unavailable')
  }
  const mode = request?.mode
  const text = request?.text ?? ''
  const expected = request?.expected
  if (!REFINEMENT_MODES.includes(mode) || typeof text !== 'string'
    || (expected !== null && typeof expected !== 'string')) {
    return failed('This request was not valid. Please try again.', 'invalid')
  }
  if (typeof imageId !== 'string' || !uuid.test(imageId)) {
    return failed('This image could not be found.', 'not-found')
  }

  const session = await signedIn()
  if (!session) return failed('Please sign in again to change the context.', 'unavailable')
  const { row, error } = await readOwnImage(session, imageId)
  if (error) return failed('We couldn’t save the context. Please try again.', 'failed')
  if (!row) return failed(NOT_FOUND, 'not-found')

  // The panel shows what it last loaded. If that is stale, refuse instead of overwriting.
  const current = normalizeContext(row.additional_context)
  if (current !== normalizeContext(expected)) {
    return { ...failed(CONFLICT, 'conflict'), current }
  }
  // The combined result is checked, so an addition cannot push the total over the limit.
  const effective = combineContext(current, mode, text)
  if (!effective.ok) return failed(effective.error, 'invalid')

  // The context must not change while a job for this image runs, and the API must run each
  // job from its own copy of the context. Checked before writing; unknown means no.
  const state = await apiState(session, imageId)
  if (!state) {
    return failed('We couldn’t check the caption service. Nothing was saved.', 'unavailable')
  }
  if (!state.supportsContextSnapshots) return failed(UNSUPPORTED, 'unavailable')
  if (state.activeJob) return failed(BUSY, 'busy')

  if (effective.context === current) return { ok: true, context: current }

  // Compare-and-set: the write only applies if the row still holds the value checked above.
  let update = session.supabase
    .from('images')
    .update({ additional_context: effective.context, modified_by_user_id: session.user.id })
    .eq('id', imageId)
    .eq('profile_id', session.user.id)
    .not('is_common_use', 'is', true)
  update = row.additional_context === null
    ? update.is('additional_context', null)
    : update.eq('additional_context', row.additional_context)
  const { data, error: updateError } = await update.select('id')

  if (updateError) {
    console.error('Error saving image context:', updateError.code)
    return failed('We couldn’t save the context. Please try again.', 'failed')
  }
  // Zero rows means RLS blocked it or the context changed after it was read.
  if (data?.length !== 1) return failed(CONFLICT, 'conflict')
  return { ok: true, context: effective.context }
}

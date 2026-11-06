'use server'

import { validateNudge } from '@/utils/image-nudge'
import { NUDGE_SAVE_FAILED_ERROR, type NudgeSaveResult } from '@/utils/nudge-upload-flow'
import { createClient } from '@/utils/supabase/server'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// The caption API logs full prompts to llm_model_responses, which anonymous clients can read
// in the restored database. Only the exact value 'true' allows real nudge text to be saved.
const isNudgePersistenceEnabled = () => process.env.ENABLE_NUDGE_PERSISTENCE === 'true'

export async function getNudgeAvailabilityAction(): Promise<boolean> {
  return isNudgePersistenceEnabled()
}

// Failures are returned, not thrown: Next.js hides thrown messages from production clients.
export async function updateImageNudgeAction(
  imageId: string,
  nudge: string,
): Promise<NudgeSaveResult> {
  if (!isNudgePersistenceEnabled()) {
    return {
      ok: false,
      error: 'Personalized captions are unavailable right now. Your nudge wasn’t saved, '
        + 'and no captions were generated.',
    }
  }

  const validation = validateNudge(typeof nudge === 'string' ? nudge : '')
  if (!validation.ok) return validation
  if (!validation.nudge) return { ok: false, error: 'Add a nudge before saving it.' }
  if (typeof imageId !== 'string' || !uuid.test(imageId)) {
    return { ok: false, error: 'This image could not be found.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous || user.app_metadata?.provider === 'anonymous') {
    return { ok: false, error: 'Please sign in again to use a nudge.' }
  }

  const { data, error } = await supabase
    .from('images')
    .update({ additional_context: validation.nudge, modified_by_user_id: user.id })
    .eq('id', imageId)
    .eq('profile_id', user.id)
    // Shared images never take a nudge, even when their owner is the signed-in user.
    .not('is_common_use', 'is', true)
    .select('id')

  if (error) {
    // Log only the code: database error details can quote the row, including the nudge.
    console.error('Error saving image nudge:', error.code)
    return { ok: false, error: NUDGE_SAVE_FAILED_ERROR }
  }
  // RLS reports a blocked update as success with no rows, so the count is the real check.
  if (data?.length !== 1) {
    return {
      ok: false,
      error: 'We couldn’t find this image on your account, so your nudge wasn’t saved and '
        + 'no captions were generated.',
    }
  }

  return { ok: true }
}

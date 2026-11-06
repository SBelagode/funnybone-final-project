'use server'

import { createClient } from '@/utils/supabase/server'

export const updateCaptionPublicAction = async (captionId: string, isPublic: boolean) => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not found.')
  }

  const { error } = await supabase
    .from('captions')
    .update({
      is_public: isPublic,
      modified_by_user_id: user.id,
    })
    .eq('id', captionId)

  if (error) {
    console.error('Error updating caption public status:', error)
    throw new Error('Failed to update caption public status')
  }

  return { success: true }
}

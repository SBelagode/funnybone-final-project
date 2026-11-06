'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const deleteAccountAction = async () => {
  const supabase = await createClient()

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('User not found or failed to fetch user')
  }

  try {
    const { error: profilesError } = await supabase.from('profiles').delete().eq('id', user.id)
    if (profilesError) throw new Error(`Failed to delete profile: ${profilesError.message}`)

    // 6. Delete the user from auth using service role
    const serviceRoleClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    )

    // Delete the user directly without signing out first
    const { error: deleteUserError } = await serviceRoleClient.auth.admin.deleteUser(user.id)
    if (deleteUserError) {
      throw new Error(`Failed to delete user from auth: ${deleteUserError.message}`)
    }

    // Finally, sign out the current session
    await supabase.auth.signOut({ scope: 'local' })

    return { success: true }
  } catch (error) {
    console.error('Error deleting account:', error)
    throw error // Rethrow to handle it in the UI
  }
}

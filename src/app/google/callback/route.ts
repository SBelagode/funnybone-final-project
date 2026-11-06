import { NextResponse } from 'next/server'

import { resolveEmailDomainStatus } from '@/utils/domain'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const idToken = searchParams.get('id_token')
  const next = searchParams.get('next') ?? '/'
  const redirectTo = searchParams.get('redirect_to') ?? '/'

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Authentication code missing')}`
    )
  }

  if (!idToken) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('ID token missing')}`)
  }

  try {
    const supabase = await createClient()

    const {
      data: { user: idTokenUser },
      error: userError,
    } = await supabase.auth.getUser(idToken)

    if (userError || !idTokenUser?.email) {
      console.error('Failed to get user from Google ID token:', userError)
      await supabase.auth.signOut({ scope: 'local' })
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Failed to get user email')}`
      )
    }

    const serviceRoleKey = process.env.SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasServiceRole = serviceRoleKey && supabaseUrl
    const serviceRoleClient = hasServiceRole
      ? createSupabaseClient(supabaseUrl!, serviceRoleKey!, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
          },
        })
      : null

    if (!hasServiceRole) {
      console.warn(
        'SERVICE_ROLE_KEY not available; skipping admin user reconciliation during Google login.'
      )
    } else {
      const adminClient = serviceRoleClient!
      const { data: authUsers, error: listUsersError } = await adminClient.auth.admin.listUsers()

      if (listUsersError) {
        console.error('Error listing Supabase auth users:', listUsersError)
      } else {
        const existingAuthUser = authUsers.users.find((u) => u.email === idTokenUser.email)

        if (existingAuthUser) {
          const { data: profileData, error: existingProfileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', existingAuthUser.id)
            .maybeSingle()

          if (existingProfileError) {
            console.error('Error checking existing profile for Google login:', existingProfileError)
            return NextResponse.redirect(
              `${origin}/login?error=${encodeURIComponent('Error checking profile')}`
            )
          }

          if (!profileData) {
            const { error: deleteError } = await adminClient.auth.admin.deleteUser(
              existingAuthUser.id
            )
            if (deleteError) {
              console.error('Error deleting stale auth user during Google login:', deleteError)
            }
          }
        }
      }
    }

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Error exchanging Google auth code:', exchangeError)
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Authentication failed')}`
      )
    }

    const {
      data: { user: sessionUser },
      error: sessionUserError,
    } = await supabase.auth.getUser()

    if (sessionUserError || !sessionUser) {
      console.error('Error fetching user after Google session exchange:', sessionUserError)
      await supabase.auth.signOut({ scope: 'local' })
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Authentication failed')}`
      )
    }

    if (!sessionUser.email) {
      console.error('Authenticated Google user missing email:', sessionUser.id)
      await supabase.auth.signOut({ scope: 'local' })
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Invalid email address')}`
      )
    }

    const { isAllowed: isDomainAllowed, error: domainStatusError } = await resolveEmailDomainStatus(
      supabase,
      sessionUser.email
    )

    if (domainStatusError) {
      console.error('Error resolving email domain status during Google login:', domainStatusError)
    }

    const { data: profile, error: profileQueryError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', sessionUser.id)
      .maybeSingle()

    if (profileQueryError) {
      console.error('Error fetching profile after Google authentication:', profileQueryError)
      await supabase.auth.signOut({ scope: 'local' })
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Error checking profile')}`
      )
    }

    if (profile) {
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({
          email: sessionUser.email,
          modified_by_user_id: sessionUser.id,
        })
        .eq('id', sessionUser.id)

      if (updateProfileError) {
        console.error('Error updating profile after Google login:', updateProfileError)
        await supabase.auth.signOut({ scope: 'local' })
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent(
            'Failed to refresh profile. Please try again.'
          )}`
        )
      }
    } else {
      const { error: insertProfileError } = await supabase.from('profiles').insert({
        id: sessionUser.id,
        email: sessionUser.email,
        created_by_user_id: sessionUser.id,
        modified_by_user_id: sessionUser.id,
      })

      if (insertProfileError) {
        console.error('Error creating profile after Google login:', insertProfileError)
        await supabase.auth.signOut({ scope: 'local' })
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent(
            'Failed to create profile. Please try again.'
          )}`
        )
      }

      if (!isDomainAllowed) {
        await supabase.auth.signOut({ scope: 'local' })
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent('Your account is pending activation.')}`
        )
      }
    }

    // Prefer the original host when coming through a load balancer.
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    if (isLocalEnv) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${next}`)
    }
    return NextResponse.redirect(`${origin}${next}`)
  } catch (error) {
    console.error('Error during authentication:', error)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Authentication failed')}`
    )
  }

  if (redirectTo) {
    return NextResponse.redirect(`${origin}${redirectTo}`)
  }

  return NextResponse.redirect(`${origin}/`)
}

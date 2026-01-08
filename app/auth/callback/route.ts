import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const fromPage = requestUrl.searchParams.get('from')

  console.log('🔍 Callback received:', { code: !!code, fromPage })

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('❌ Session exchange error:', error)
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
    }

    if (data.session) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, onboarding_completed')
        .eq('user_id', data.session.user.id)
        .single()

      console.log('🔍 Session check:', {
        fromPage,
        hasProfile: !!profile,
        userId: data.session.user.id,
        email: data.session.user.email
      })

      // NEW user from LOGIN page → Reject
      if (fromPage === 'login' && !profile) {
        console.log('🚫 Rejecting new user from login page')
        await supabase.auth.signOut()
        return NextResponse.redirect(
          new URL('/login?error=no_account', request.url)
        )
      }
      // NEW user from SIGNUP page → Create partial profile, redirect to Step 2
      else if (fromPage === 'signup' && !profile) {
        console.log('✅ Creating profile for new signup user')
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: data.session.user.id,
            email: data.session.user.email!,
            first_name: data.session.user.user_metadata.full_name?.split(' ')[0] || 'User',
            surname: data.session.user.user_metadata.full_name?.split(' ').slice(1).join(' ') || '',
            auth_provider: 'google',
            avatar_url: data.session.user.user_metadata.avatar_url,
            onboarding_completed: false,
          })

        if (insertError) {
          console.error('❌ Error creating profile:', insertError)
          return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
        }

        console.log('✅ Profile created, redirecting to Step 2')
        return NextResponse.redirect(new URL('/signup?step=2', request.url))
      }
      // EXISTING user → Check if onboarding completed
      else if (profile) {
        if (!profile.onboarding_completed) {
          console.log('⚠️ Existing user with incomplete onboarding')
          return NextResponse.redirect(new URL('/signup?step=2', request.url))
        }

        console.log('✅ Existing user with complete profile, redirecting to dashboard')
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      // Edge case
      else {
        console.warn('⚠️ Unexpected state')
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
      }
    }
  }

  console.log('⚠️ No code or session found')
  return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
}
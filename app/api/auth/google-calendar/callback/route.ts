import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens } from '@/lib/google-calendar'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state')

  if (error || !code) {
    return NextResponse.redirect(`${origin}/menu?error=google_auth_failed`)
  }

  // CSRF state verification
  const cookieStore = cookies()
  const savedState = cookieStore.get('google_oauth_state')?.value
  if (!state || !savedState || state !== savedState) {
    return NextResponse.redirect(`${origin}/menu?error=invalid_state`)
  }

  const tokens = await exchangeCodeForTokens(code)
  if (!tokens.access_token) {
    return NextResponse.redirect(`${origin}/menu?error=token_exchange_failed`)
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000)

  // Try saving with google_token_expires_at
  const { error: updateError } = await supabase
    .from('users')
    .update({
      google_access_token: tokens.access_token,
      google_refresh_token: tokens.refresh_token ?? null,
      google_token_expires_at: expiresAt.toISOString(),
    })
    .eq('id', user.id)

  if (updateError) {
    // Fallback: save without google_token_expires_at (migration not yet applied)
    const { error: fallbackError } = await supabase
      .from('users')
      .update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token ?? null,
      })
      .eq('id', user.id)

    if (fallbackError) {
      return NextResponse.redirect(`${origin}/menu?error=token_save_failed`)
    }
  }

  const response = NextResponse.redirect(`${origin}/menu?success=google_connected`)
  // Clear the state cookie
  response.cookies.set('google_oauth_state', '', { maxAge: 0, path: '/' })
  return response
}

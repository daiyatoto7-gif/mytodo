import { getOAuthUrl } from '@/lib/google-calendar'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export async function GET() {
  const state = randomBytes(16).toString('hex')
  const response = NextResponse.redirect(getOAuthUrl(state))
  response.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    maxAge: 600,
    sameSite: 'lax',
    path: '/',
  })
  return response
}

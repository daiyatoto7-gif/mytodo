const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3'

export interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  htmlLink?: string
  start: { dateTime?: string; date?: string; timeZone?: string }
  end: { dateTime?: string; date?: string; timeZone?: string }
}

export interface TokenResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  error?: string
}

type CalendarEventBody = {
  summary: string
  description?: string
  start: { dateTime?: string; date?: string; timeZone?: string }
  end: { dateTime?: string; date?: string; timeZone?: string }
}

export function getOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google-calendar/callback`,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.events',
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  return `${GOOGLE_AUTH_URL}?${params}`
}

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google-calendar/callback`,
      grant_type: 'authorization_code',
    }),
  })
  return res.json()
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  })
  return res.json()
}

export async function createCalendarEvent(
  accessToken: string,
  event: CalendarEventBody
): Promise<GoogleCalendarEvent> {
  const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  })
  return res.json()
}

export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  event: CalendarEventBody
): Promise<GoogleCalendarEvent> {
  const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  })
  return res.json()
}

export async function removeCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export async function listCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<{ items?: GoogleCalendarEvent[] }> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '100',
  })
  const res = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  return res.json()
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID')!
const FIREBASE_CLIENT_EMAIL = Deno.env.get('FIREBASE_CLIENT_EMAIL')!
// Private key stored as single-line with literal \n
const FIREBASE_PRIVATE_KEY = Deno.env.get('FIREBASE_PRIVATE_KEY')!.replace(/\\n/g, '\n')

// ── Google OAuth2 helper (no external JWT library needed) ─────────────────────

function base64url(input: string | Uint8Array): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

async function getGoogleAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64url(
    JSON.stringify({
      iss: FIREBASE_CLIENT_EMAIL,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  )
  const signingInput = `${header}.${payload}`

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(FIREBASE_PRIVATE_KEY),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sigBytes = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput))
  )
  const jwt = `${signingInput}.${base64url(sigBytes)}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const json = await res.json()
  if (!json.access_token) throw new Error(`OAuth failed: ${JSON.stringify(json)}`)
  return json.access_token
}

// ── FCM send helper ───────────────────────────────────────────────────────────

async function sendFCM(
  accessToken: string,
  fcmToken: string,
  title: string,
  body: string,
  taskId: string
): Promise<boolean> {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token: fcmToken,
          notification: { title, body },
          webpush: {
            notification: {
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-192x192.png',
              tag: taskId,
              renotify: true,
            },
            fcm_options: { link: `/task/${taskId}` },
          },
          data: { taskId, url: `/task/${taskId}` },
        },
      }),
    }
  )
  return res.ok
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const now = new Date().toISOString()

    // Fetch pending reminders, join through tasks → users to get FCM token
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select(
        `id, task_id, remind_at,
         task:tasks!inner ( title, user:users!inner ( fcm_token ) )`
      )
      .lte('remind_at', now)
      .eq('is_sent', false)

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
    }

    const accessToken = await getGoogleAccessToken()
    let sent = 0

    for (const reminder of reminders) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = reminder as any
      const fcmToken = r.task?.user?.fcm_token as string | null

      // Always mark as sent (even if no token) to avoid re-processing
      await supabase.from('reminders').update({ is_sent: true }).eq('id', r.id)

      if (!fcmToken) continue

      const ok = await sendFCM(
        accessToken,
        fcmToken,
        'タスクリマインダー',
        r.task?.title ?? 'タスクの時間です',
        r.task_id
      )
      if (ok) sent++
    }

    return new Response(JSON.stringify({ sent, total: reminders.length }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import * as gcal from '@/lib/google-calendar'
import type { Task } from '@/types'

export type { GoogleCalendarEvent } from '@/lib/google-calendar'

async function getValidAccessToken(): Promise<string | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // Try selecting with google_token_expires_at; fall back if column doesn't exist yet
  const { data, error: selectError } = await supabase
    .from('users')
    .select('google_access_token, google_refresh_token, google_token_expires_at')
    .eq('id', user.id)
    .single()

  let tokenData: { google_access_token: string | null; google_refresh_token: string | null; google_token_expires_at?: string | null } | null = data
  if (selectError) {
    const { data: fallbackData } = await supabase
      .from('users')
      .select('google_access_token, google_refresh_token')
      .eq('id', user.id)
      .single()
    tokenData = fallbackData
  }

  if (!tokenData?.google_access_token || !tokenData?.google_refresh_token) return null

  const expiresAt = tokenData.google_token_expires_at
    ? new Date(tokenData.google_token_expires_at)
    : new Date(0)

  // Return existing token if still valid (with 1-minute buffer)
  if (expiresAt > new Date(Date.now() + 60_000)) {
    return tokenData.google_access_token
  }

  // Refresh expired token
  const tokens = await gcal.refreshAccessToken(tokenData.google_refresh_token)
  if (!tokens.access_token) return null

  const newExpiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000)
  const { error: refreshSaveError } = await supabase
    .from('users')
    .update({
      google_access_token: tokens.access_token,
      google_token_expires_at: newExpiresAt.toISOString(),
    })
    .eq('id', user.id)

  if (refreshSaveError) {
    // Fallback: save without google_token_expires_at (migration not yet applied)
    await supabase
      .from('users')
      .update({ google_access_token: tokens.access_token })
      .eq('id', user.id)
  }

  return tokens.access_token
}

function buildCalendarEvent(task: Task) {
  const base = {
    summary: task.title,
    ...(task.memo ? { description: task.memo } : {}),
  }
  if (task.due_time) {
    const timeStr = task.due_time.substring(0, 5) // HH:MM
    const start = new Date(`${task.due_date}T${timeStr}:00`)
    const end = new Date(start.getTime() + 30 * 60 * 1000)
    return {
      ...base,
      start: { dateTime: start.toISOString(), timeZone: 'Asia/Tokyo' },
      end: { dateTime: end.toISOString(), timeZone: 'Asia/Tokyo' },
    }
  }
  return {
    ...base,
    start: { date: task.due_date! },
    end: { date: task.due_date! },
  }
}

export async function getGoogleCalendarStatus(): Promise<boolean> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('users')
    .select('google_refresh_token')
    .eq('id', user.id)
    .single()

  return !!data?.google_refresh_token
}

export async function syncTaskToCalendar(
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .eq('user_id', user.id)
    .single()

  if (!task) return { success: false, error: 'Task not found' }
  if (!task.due_date) return { success: false, error: '期限日が設定されていません' }

  const accessToken = await getValidAccessToken()
  if (!accessToken) return { success: false, error: 'Googleカレンダーに未接続です' }

  const event = buildCalendarEvent(task as Task)

  if (task.google_calendar_event_id) {
    await gcal.updateCalendarEvent(accessToken, task.google_calendar_event_id, event)
  } else {
    const created = await gcal.createCalendarEvent(accessToken, event)
    if (created.id) {
      await supabase
        .from('tasks')
        .update({ google_calendar_event_id: created.id })
        .eq('id', taskId)
    }
  }

  revalidatePath(`/task/${taskId}`)
  revalidatePath('/calendar')
  return { success: true }
}

export async function removeTaskFromCalendar(taskId: string): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { data: task } = await supabase
    .from('tasks')
    .select('google_calendar_event_id')
    .eq('id', taskId)
    .eq('user_id', user.id)
    .single()

  if (!task?.google_calendar_event_id) return

  const accessToken = await getValidAccessToken()
  if (!accessToken) return

  await gcal.removeCalendarEvent(accessToken, task.google_calendar_event_id)
  await supabase
    .from('tasks')
    .update({ google_calendar_event_id: null })
    .eq('id', taskId)
}

export async function getGoogleCalendarEvents(
  year: number,
  month: number
): Promise<gcal.GoogleCalendarEvent[]> {
  const timeMin = new Date(year, month - 1, 1).toISOString()
  const timeMax = new Date(year, month, 0, 23, 59, 59).toISOString()

  const accessToken = await getValidAccessToken()
  if (!accessToken) return []

  const data = await gcal.listCalendarEvents(accessToken, timeMin, timeMax)
  return data.items ?? []
}

export async function disconnectGoogleCalendar(): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('users')
    .update({
      google_access_token: null,
      google_refresh_token: null,
      google_token_expires_at: null,
    })
    .eq('id', user.id)

  revalidatePath('/menu')
}

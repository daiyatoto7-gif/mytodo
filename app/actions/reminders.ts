'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getReminders(taskId: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('task_id', taskId)
    .order('remind_at', { ascending: true })

  if (error) return []
  return data
}

export async function createReminder(taskId: string, remindAt: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('reminders').insert({
    task_id: taskId,
    remind_at: remindAt,
  })

  if (error) return { error: error.message }
  revalidatePath(`/task/${taskId}`)
  return { success: true }
}

export async function deleteReminder(id: string, taskId: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('reminders').delete().eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/task/${taskId}`)
  return { success: true }
}

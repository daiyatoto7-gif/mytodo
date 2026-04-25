'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSubtask(taskId: string, title: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('subtasks').insert({
    task_id: taskId,
    title,
  })

  if (error) return { error: error.message }
  revalidatePath(`/task/${taskId}`)
  return { success: true }
}

export async function toggleSubtask(id: string, taskId: string, is_completed: boolean) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('subtasks')
    .update({ is_completed })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/task/${taskId}`)
  revalidatePath('/today')
  revalidatePath('/all')
  return { success: true }
}

export async function deleteSubtask(id: string, taskId: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('subtasks').delete().eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/task/${taskId}`)
  return { success: true }
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Priority } from '@/types'

export async function getTasks(filter?: {
  view?: 'today' | 'all'
  categoryId?: string
  completed?: boolean
  search?: string
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from('tasks')
    .select('*, category:categories(*), subtasks(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (filter?.view === 'today') {
    const today = new Date().toISOString().split('T')[0]
    query = query.or(`due_date.eq.${today},due_date.lt.${today}`)
  }

  if (filter?.categoryId) {
    query = query.eq('category_id', filter.categoryId)
  }

  if (filter?.completed !== undefined) {
    query = query.eq('is_completed', filter.completed)
  }

  if (filter?.search) {
    query = query.or(
      `title.ilike.%${filter.search}%,memo.ilike.%${filter.search}%`
    )
  }

  const { data, error } = await query
  if (error) {
    console.error('Error fetching tasks:', error)
    return []
  }
  return data
}

export async function getTask(id: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('tasks')
    .select('*, category:categories(*), subtasks(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) return null
  return data
}

export async function createTask(formData: {
  title: string
  memo?: string
  due_date?: string
  due_time?: string
  category_id?: string
  priority?: Priority
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('tasks').insert({
    user_id: user.id,
    title: formData.title,
    memo: formData.memo || null,
    due_date: formData.due_date || null,
    due_time: formData.due_time || null,
    category_id: formData.category_id || null,
    priority: formData.priority || 'medium',
  })

  if (error) return { error: error.message }
  revalidatePath('/today')
  revalidatePath('/all')
  return { success: true }
}

export async function updateTask(
  id: string,
  updates: Partial<{
    title: string
    memo: string
    due_date: string
    due_time: string
    category_id: string
    priority: Priority
    is_completed: boolean
  }>
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/today')
  revalidatePath('/all')
  revalidatePath(`/task/${id}`)
  return { success: true }
}

export async function deleteTask(id: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/today')
  revalidatePath('/all')
  return { success: true }
}

export async function toggleTaskComplete(id: string, is_completed: boolean) {
  return updateTask(id, { is_completed })
}

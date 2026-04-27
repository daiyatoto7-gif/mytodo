'use server'

import { createClient } from '@/lib/supabase/server'

export async function saveFCMToken(token: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('users')
    .update({ fcm_token: token })
    .eq('id', user.id)

  return error ? { error: error.message } : { success: true }
}

export async function clearFCMToken() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('users')
    .update({ fcm_token: null })
    .eq('id', user.id)

  return error ? { error: error.message } : { success: true }
}

export type Priority = 'high' | 'medium' | 'low'

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  memo: string | null
  due_date: string | null
  due_time: string | null
  category_id: string | null
  priority: Priority
  is_completed: boolean
  google_calendar_event_id: string | null
  created_at: string
  updated_at: string
  category?: Category
  subtasks?: Subtask[]
  reminders?: Reminder[]
}

export interface Subtask {
  id: string
  task_id: string
  title: string
  is_completed: boolean
  created_at: string
}

export interface Reminder {
  id: string
  task_id: string
  remind_at: string
  is_sent: boolean
  created_at: string
}

export interface User {
  id: string
  email: string
  fcm_token: string | null
  google_access_token: string | null
  google_refresh_token: string | null
  google_token_expires_at: string | null
}

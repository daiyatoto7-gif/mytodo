'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Plus, Check, Bell, BellOff, CalendarDays } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { clsx } from 'clsx'
import { getTask, updateTask, deleteTask } from '@/app/actions/tasks'
import { syncTaskToCalendar, removeTaskFromCalendar } from '@/app/actions/google-calendar'
import { getCategories } from '@/app/actions/categories'
import { createSubtask, toggleSubtask, deleteSubtask } from '@/app/actions/subtasks'
import { createReminder, deleteReminder } from '@/app/actions/reminders'
import type { Task, Category, Priority, Reminder } from '@/types'

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
]

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [newSubtask, setNewSubtask] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    memo: '',
    due_date: '',
    due_time: '',
    category_id: '',
    priority: 'medium' as Priority,
  })
  const [newRemindAt, setNewRemindAt] = useState('')
  const [isAddingReminder, setIsAddingReminder] = useState(false)
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false)
  const [calendarSyncMessage, setCalendarSyncMessage] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)

  async function loadData() {
    try {
      const [taskData, categoriesData] = await Promise.all([
        getTask(params.id),
        getCategories(),
      ])
      if (taskData) {
        setTask(taskData as Task)
        setEditForm({
          title: taskData.title,
          memo: taskData.memo ?? '',
          due_date: taskData.due_date ?? '',
          due_time: taskData.due_time ?? '',
          category_id: taskData.category_id ?? '',
          priority: taskData.priority as Priority,
        })
      } else {
        setLoadError(true)
      }
      setCategories(categoriesData as Category[])
    } catch {
      setLoadError(true)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  async function handleSave() {
    if (!task) return
    await updateTask(task.id, {
      title: editForm.title,
      memo: editForm.memo || undefined,
      due_date: editForm.due_date || undefined,
      due_time: editForm.due_time || undefined,
      category_id: editForm.category_id || undefined,
      priority: editForm.priority,
    })
    setIsEditing(false)
    loadData()
  }

  async function handleDelete() {
    if (!task) return
    if (confirm('このタスクを削除しますか？')) {
      if (task.google_calendar_event_id) {
        await removeTaskFromCalendar(task.id)
      }
      await deleteTask(task.id)
      router.back()
    }
  }

  async function handleSyncCalendar() {
    if (!task) return
    setIsSyncingCalendar(true)
    setCalendarSyncMessage(null)
    const result = await syncTaskToCalendar(task.id)
    if (result.success) {
      setCalendarSyncMessage('同期しました')
      loadData()
    } else {
      setCalendarSyncMessage(result.error ?? 'エラーが発生しました')
    }
    setIsSyncingCalendar(false)
    setTimeout(() => setCalendarSyncMessage(null), 3000)
  }

  async function handleAddSubtask(e: React.FormEvent) {
    e.preventDefault()
    if (!task || !newSubtask.trim()) return
    await createSubtask(task.id, newSubtask.trim())
    setNewSubtask('')
    loadData()
  }

  async function handleAddReminder(e: React.FormEvent) {
    e.preventDefault()
    if (!task || !newRemindAt) return
    setIsAddingReminder(true)
    // Convert local datetime-local value to ISO string
    const localDate = new Date(newRemindAt)
    await createReminder(task.id, localDate.toISOString())
    setNewRemindAt('')
    setIsAddingReminder(false)
    loadData()
  }

  async function handleDeleteReminder(reminderId: string) {
    if (!task) return
    await deleteReminder(reminderId, task.id)
    loadData()
  }

  function formatReminderDate(isoString: string) {
    return format(new Date(isoString), 'yyyy/M/d(EEE) HH:mm', { locale: ja })
  }

  // Default datetime-local value: current time + 10 min, rounded to nearest 5 min
  function getDefaultRemindAt() {
    const d = new Date(Date.now() + 10 * 60 * 1000)
    d.setSeconds(0, 0)
    d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5)
    return d.toISOString().slice(0, 16)
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">タスクが見つかりません</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-blue-500 hover:underline"
        >
          戻る
        </button>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    )
  }

  const sortedReminders = [...(task.reminders ?? [])].sort(
    (a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime()
  )

  return (
    <div className="px-4 pt-12 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">戻る</span>
        </button>
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="text-sm text-gray-400"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                className="text-sm font-medium text-gray-900 dark:text-white"
              >
                保存
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm font-medium text-gray-900 dark:text-white"
              >
                編集
              </button>
              <button
                onClick={handleDelete}
                className="text-red-500 hover:text-red-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Task content */}
      <div className="space-y-5">
        {/* Title */}
        {isEditing ? (
          <input
            type="text"
            value={editForm.title}
            onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full text-xl font-bold bg-transparent border-b border-gray-200 dark:border-gray-700 pb-1 outline-none text-gray-900 dark:text-white"
          />
        ) : (
          <h1
            className={clsx(
              'text-xl font-bold',
              task.is_completed
                ? 'line-through text-gray-400 dark:text-gray-500'
                : 'text-gray-900 dark:text-white'
            )}
          >
            {task.title}
          </h1>
        )}

        {/* Fields */}
        <div className="grid grid-cols-2 gap-3">
          {/* Priority */}
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">優先度</p>
            {isEditing ? (
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {PRIORITIES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setEditForm((f) => ({ ...f, priority: value }))}
                    className={clsx(
                      'flex-1 py-1.5 text-xs transition-colors',
                      editForm.priority === value
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                        : 'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-sm text-gray-900 dark:text-white">
                {PRIORITIES.find((p) => p.value === task.priority)?.label}
              </span>
            )}
          </div>

          {/* Category */}
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">カテゴリ</p>
            {isEditing ? (
              <select
                value={editForm.category_id}
                onChange={(e) => setEditForm((f) => ({ ...f, category_id: e.target.value }))}
                className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
              >
                <option value="">なし</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-gray-900 dark:text-white">
                {task.category?.name ?? 'なし'}
              </span>
            )}
          </div>

          {/* Due date */}
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">期限日</p>
            {isEditing ? (
              <input
                type="date"
                value={editForm.due_date}
                onChange={(e) => setEditForm((f) => ({ ...f, due_date: e.target.value }))}
                className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
              />
            ) : (
              <span className="text-sm text-gray-900 dark:text-white">
                {task.due_date
                  ? format(new Date(task.due_date), 'yyyy/M/d')
                  : 'なし'}
              </span>
            )}
          </div>

          {/* Due time */}
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">期限時刻</p>
            {isEditing ? (
              <input
                type="time"
                value={editForm.due_time}
                onChange={(e) => setEditForm((f) => ({ ...f, due_time: e.target.value }))}
                className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
              />
            ) : (
              <span className="text-sm text-gray-900 dark:text-white">
                {task.due_time ? task.due_time.slice(0, 5) : 'なし'}
              </span>
            )}
          </div>
        </div>

        {/* Memo */}
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">メモ</p>
          {isEditing ? (
            <textarea
              value={editForm.memo}
              onChange={(e) => setEditForm((f) => ({ ...f, memo: e.target.value }))}
              rows={3}
              placeholder="メモを追加..."
              className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 placeholder:text-gray-300 dark:placeholder:text-gray-600 outline-none resize-none"
            />
          ) : (
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {task.memo || <span className="text-gray-300 dark:text-gray-600">なし</span>}
            </p>
          )}
        </div>

        {/* Google Calendar */}
        {task.due_date && (
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Googleカレンダー
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSyncCalendar}
                disabled={isSyncingCalendar}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-40 transition-colors"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                {isSyncingCalendar
                  ? '同期中...'
                  : task.google_calendar_event_id
                  ? 'カレンダーを更新'
                  : 'カレンダーに追加'}
              </button>
              {task.google_calendar_event_id && (
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />
                  連携済み
                </span>
              )}
            </div>
            {calendarSyncMessage && (
              <p
                className={clsx(
                  'mt-1.5 text-xs',
                  calendarSyncMessage === '同期しました'
                    ? 'text-green-500'
                    : 'text-red-400'
                )}
              >
                {calendarSyncMessage}
              </p>
            )}
          </div>
        )}

        {/* Reminders */}
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            リマインダー
          </p>

          <div className="space-y-2 mb-3">
            {sortedReminders.length === 0 ? (
              <p className="text-xs text-gray-300 dark:text-gray-600">リマインダーなし</p>
            ) : (
              sortedReminders.map((reminder: Reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between gap-2 py-1.5 px-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {reminder.is_sent ? (
                      <BellOff className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                    ) : (
                      <Bell className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                    )}
                    <span
                      className={clsx(
                        'text-xs truncate',
                        reminder.is_sent
                          ? 'text-gray-300 dark:text-gray-600 line-through'
                          : 'text-gray-700 dark:text-gray-300'
                      )}
                    >
                      {formatReminderDate(reminder.remind_at)}
                    </span>
                    {reminder.is_sent && (
                      <span className="text-xs text-gray-300 dark:text-gray-600 flex-shrink-0">
                        送信済み
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteReminder(reminder.id)}
                    className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add reminder form */}
          <form onSubmit={handleAddReminder} className="flex items-center gap-2">
            <input
              type="datetime-local"
              value={newRemindAt}
              onChange={(e) => setNewRemindAt(e.target.value)}
              onFocus={(e) => {
                if (!e.target.value) e.target.value = getDefaultRemindAt()
                setNewRemindAt(e.target.value)
              }}
              min={new Date().toISOString().slice(0, 16)}
              className="flex-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 outline-none"
            />
            <button
              type="submit"
              disabled={!newRemindAt || isAddingReminder}
              className="text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Subtasks */}
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
            サブタスク
            {task.subtasks && task.subtasks.length > 0 && (
              <span className="ml-1.5">
                ({task.subtasks.filter((s) => s.is_completed).length}/{task.subtasks.length})
              </span>
            )}
          </p>

          <div className="space-y-2 mb-2">
            {task.subtasks?.map((sub) => (
              <div key={sub.id} className="flex items-center gap-2.5">
                <button
                  onClick={async () => {
                    await toggleSubtask(sub.id, task.id, !sub.is_completed)
                    loadData()
                  }}
                  className={clsx(
                    'h-4 w-4 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all',
                    sub.is_completed
                      ? 'border-gray-400 bg-gray-400 dark:border-gray-500 dark:bg-gray-500'
                      : 'border-gray-300 dark:border-gray-600'
                  )}
                >
                  {sub.is_completed && (
                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                  )}
                </button>
                <span
                  className={clsx(
                    'flex-1 text-sm',
                    sub.is_completed
                      ? 'line-through text-gray-400 dark:text-gray-500'
                      : 'text-gray-900 dark:text-white'
                  )}
                >
                  {sub.title}
                </span>
                <button
                  onClick={async () => {
                    await deleteSubtask(sub.id, task.id)
                    loadData()
                  }}
                  className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
            <input
              type="text"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              placeholder="サブタスクを追加..."
              className="flex-1 text-sm bg-transparent border-b border-gray-200 dark:border-gray-700 pb-1 outline-none text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600"
            />
            <button
              type="submit"
              disabled={!newSubtask.trim()}
              className="text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

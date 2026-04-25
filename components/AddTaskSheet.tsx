'use client'

import { useState, useRef, useEffect } from 'react'

import { clsx } from 'clsx'
import { createTask } from '@/app/actions/tasks'
import type { Category, Priority } from '@/types'

interface AddTaskSheetProps {
  isOpen: boolean
  onClose: () => void
  categories: Category[]
}

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
]

export default function AddTaskSheet({ isOpen, onClose, categories }: AddTaskSheetProps) {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setTitle('')
      setDueDate('')
      setDueTime('')
      setCategoryId('')
      setPriority('medium')
    }
  }, [isOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    const result = await createTask({
      title: title.trim(),
      due_date: dueDate || undefined,
      due_time: dueTime || undefined,
      category_id: categoryId || undefined,
      priority,
    })
    setIsSubmitting(false)

    if (!result.error) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-950 rounded-t-2xl shadow-xl">
        <div className="max-w-[600px] mx-auto">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="h-1 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>

          <form onSubmit={handleSubmit} className="px-4 pb-8 space-y-4">
            {/* Title */}
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タスクを追加..."
              className="w-full text-base font-medium bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600"
            />

            {/* Options row */}
            <div className="flex flex-wrap gap-2">
              {/* Due date */}
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
              />

              {/* Due time */}
              {dueDate && (
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                />
              )}

              {/* Category */}
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
              >
                <option value="">カテゴリなし</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {/* Priority */}
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {PRIORITIES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPriority(value)}
                    className={clsx(
                      'px-2.5 py-1.5 text-xs transition-colors',
                      priority === value
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-gray-400 dark:text-gray-500"
              >
                キャンセル
              </button>

              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="rounded-lg bg-gray-900 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-gray-900 disabled:opacity-40 transition-opacity"
              >
                追加
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

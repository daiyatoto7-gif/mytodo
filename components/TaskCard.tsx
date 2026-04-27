'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { format, isPast, isToday } from 'date-fns'
import { ja } from 'date-fns/locale'
import { toggleTaskComplete } from '@/app/actions/tasks'
import type { Task } from '@/types'

interface TaskCardProps {
  task: Task
  onUpdate?: () => void
}

const PRIORITY_LABEL: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

const PRIORITY_COLOR: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

export default function TaskCard({ task, onUpdate }: TaskCardProps) {
  // Optimistic local state for instant checkbox feedback
  const [optimisticCompleted, setOptimisticCompleted] = useState(task.is_completed)

  // Sync when server data updates (after SWR revalidation)
  useEffect(() => {
    setOptimisticCompleted(task.is_completed)
  }, [task.is_completed])

  const completedSubtasks = task.subtasks?.filter((s) => s.is_completed).length ?? 0
  const totalSubtasks = task.subtasks?.length ?? 0

  const isOverdue =
    task.due_date &&
    !optimisticCompleted &&
    isPast(new Date(task.due_date + 'T23:59:59'))

  const dueDateDisplay = task.due_date
    ? isToday(new Date(task.due_date))
      ? '今日'
      : format(new Date(task.due_date), 'M/d(EEE)', { locale: ja })
    : null

  async function handleToggle() {
    const newValue = !optimisticCompleted
    setOptimisticCompleted(newValue) // instant visual feedback
    try {
      await toggleTaskComplete(task.id, task.is_completed)
      onUpdate?.()
    } catch {
      setOptimisticCompleted(optimisticCompleted) // rollback on error
    }
  }

  return (
    <div className="flex items-start gap-3 py-3 px-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className={clsx(
          'mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all',
          optimisticCompleted
            ? 'border-gray-300 bg-gray-300 dark:border-gray-600 dark:bg-gray-600'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-500'
        )}
      >
        {optimisticCompleted && (
          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content */}
      <Link href={`/task/${task.id}`} className="flex-1 min-w-0">
        <p
          className={clsx(
            'text-sm font-medium truncate',
            optimisticCompleted
              ? 'line-through text-gray-400 dark:text-gray-500'
              : 'text-gray-900 dark:text-white'
          )}
        >
          {task.title}
        </p>

        {/* Badges */}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {task.category && (
            <span
              className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md"
              style={{
                backgroundColor: task.category.color + '20',
                color: task.category.color,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full inline-block"
                style={{ backgroundColor: task.category.color }}
              />
              {task.category.name}
            </span>
          )}

          <span className={clsx('text-xs px-1.5 py-0.5 rounded-md', PRIORITY_COLOR[task.priority])}>
            {PRIORITY_LABEL[task.priority]}
          </span>

          {dueDateDisplay && (
            <span className={clsx('text-xs', isOverdue ? 'text-red-500' : 'text-gray-400 dark:text-gray-500')}>
              {dueDateDisplay}
              {task.due_time && ` ${task.due_time.slice(0, 5)}`}
            </span>
          )}
        </div>

        {/* Subtask progress bar */}
        {totalSubtasks > 0 && (
          <div className="mt-1.5">
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-400 dark:bg-gray-500 rounded-full transition-all"
                  style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                {completedSubtasks}/{totalSubtasks}
              </span>
            </div>
          </div>
        )}
      </Link>
    </div>
  )
}

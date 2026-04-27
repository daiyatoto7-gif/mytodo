'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import TaskCard from '@/components/TaskCard'
import AddTaskSheet from '@/components/AddTaskSheet'
import FAB from '@/components/FAB'
import { useTasks, useCategories } from '@/hooks/useTaskData'
import type { Priority } from '@/types'

type StatusFilter = 'all' | 'incomplete' | 'completed'

export default function TodayPage() {
  const { tasks, refresh } = useTasks({ view: 'today' })
  const { categories } = useCategories()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('incomplete')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('')

  const filtered = tasks.filter((t) => {
    if (statusFilter === 'incomplete' && t.is_completed) return false
    if (statusFilter === 'completed' && !t.is_completed) return false
    if (categoryFilter && t.category_id !== categoryFilter) return false
    if (priorityFilter && t.priority !== priorityFilter) return false
    return true
  })

  const today = new Date().toISOString().split('T')[0]
  const overdueTasks = filtered.filter(
    (t) => t.due_date && t.due_date < today && !t.is_completed
  )
  const todayTasks = filtered.filter(
    (t) => !t.due_date || t.due_date === today || t.is_completed
  )

  const todayLabel = format(new Date(), 'M月d日(EEE)', { locale: ja })

  const PRIORITIES: { value: Priority; label: string }[] = [
    { value: 'high', label: '高' },
    { value: 'medium', label: '中' },
    { value: 'low', label: '低' },
  ]

  return (
    <div className="px-4 pt-12">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{todayLabel}</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">今日のタスク</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-3 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {(['all', 'incomplete', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === f
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {f === 'all' ? 'すべて' : f === 'incomplete' ? '未完了' : '完了済み'}
          </button>
        ))}
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setCategoryFilter('')}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              !categoryFilter
                ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
                : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            すべて
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                categoryFilter === cat.id
                  ? 'border-transparent text-white'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
              }`}
              style={
                categoryFilter === cat.id
                  ? { backgroundColor: cat.color, borderColor: cat.color }
                  : {}
              }
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Priority filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setPriorityFilter('')}
          className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
            !priorityFilter
              ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
              : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
          }`}
        >
          優先度: すべて
        </button>
        {PRIORITIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setPriorityFilter(priorityFilter === value ? '' : value)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              priorityFilter === value
                ? value === 'high'
                  ? 'border-red-500 bg-red-500 text-white'
                  : value === 'medium'
                  ? 'border-yellow-500 bg-yellow-500 text-white'
                  : 'border-green-500 bg-green-500 text-white'
                : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-600">
          <p className="text-sm">タスクがありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Overdue section */}
          {overdueTasks.length > 0 && statusFilter !== 'completed' && (
            <div>
              <p className="text-xs font-medium text-red-500 mb-2">期限切れ</p>
              <div className="space-y-2">
                {overdueTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onUpdate={refresh} />
                ))}
              </div>
            </div>
          )}

          {/* Today section */}
          {todayTasks.length > 0 && (
            <div>
              {overdueTasks.length > 0 && statusFilter !== 'completed' && (
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-2">今日</p>
              )}
              <div className="space-y-2">
                {todayTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onUpdate={refresh} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <FAB onClick={() => setIsSheetOpen(true)} />
      <AddTaskSheet
        isOpen={isSheetOpen}
        onClose={() => {
          setIsSheetOpen(false)
          refresh()
        }}
        categories={categories}
      />
    </div>
  )
}

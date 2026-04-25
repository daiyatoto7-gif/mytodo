'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import TaskCard from '@/components/TaskCard'
import AddTaskSheet from '@/components/AddTaskSheet'
import FAB from '@/components/FAB'
import { getTasks } from '@/app/actions/tasks'
import { getCategories } from '@/app/actions/categories'
import type { Task, Category } from '@/types'

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'incomplete' | 'completed'>('incomplete')

  async function loadData() {
    const [tasksData, categoriesData] = await Promise.all([
      getTasks({ view: 'today' }),
      getCategories(),
    ])
    setTasks(tasksData as Task[])
    setCategories(categoriesData as Category[])
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = tasks.filter((t) => {
    if (filter === 'incomplete') return !t.is_completed
    if (filter === 'completed') return t.is_completed
    return true
  })

  const today = format(new Date(), 'M月d日(EEE)', { locale: ja })

  return (
    <div className="px-4 pt-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{today}</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">今日のタスク</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {(['all', 'incomplete', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${
              filter === f
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {f === 'all' ? 'すべて' : f === 'incomplete' ? '未完了' : '完了済み'}
          </button>
        ))}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-600">
          <p className="text-sm">タスクがありません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}

      <FAB onClick={() => setIsSheetOpen(true)} />
      <AddTaskSheet
        isOpen={isSheetOpen}
        onClose={() => {
          setIsSheetOpen(false)
          loadData()
        }}
        categories={categories}
      />
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns'
import { ja } from 'date-fns/locale'
import { clsx } from 'clsx'
import TaskCard from '@/components/TaskCard'
import AddTaskSheet from '@/components/AddTaskSheet'
import FAB from '@/components/FAB'
import { getTasks } from '@/app/actions/tasks'
import { getCategories } from '@/app/actions/categories'
import type { Task, Category } from '@/types'

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  async function loadData() {
    const [tasksData, categoriesData] = await Promise.all([
      getTasks(),
      getCategories(),
    ])
    setTasks(tasksData as Task[])
    setCategories(categoriesData as Category[])
  }

  useEffect(() => {
    loadData()
  }, [])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPadding = getDay(monthStart)

  const selectedTasks = tasks.filter(
    (t) => t.due_date && isSameDay(new Date(t.due_date), selectedDate)
  )

  function hasTask(date: Date) {
    return tasks.some((t) => t.due_date && isSameDay(new Date(t.due_date), date))
  }

  return (
    <div className="px-4 pt-12">
      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {format(currentMonth, 'yyyy年M月', { locale: ja })}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d, i) => (
          <div
            key={d}
            className={clsx(
              'text-center text-xs py-1 font-medium',
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400 dark:text-gray-500'
            )}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden mb-6">
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} className="bg-white dark:bg-gray-950 h-10" />
        ))}
        {days.map((day) => {
          const isSelected = isSameDay(day, selectedDate)
          const hasTasks = hasTask(day)
          const isTodayDate = isToday(day)
          const dayOfWeek = getDay(day)

          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={clsx(
                'bg-white dark:bg-gray-950 h-10 flex flex-col items-center justify-center gap-0.5 transition-colors',
                isSelected && 'bg-gray-900 dark:bg-white'
              )}
            >
              <span
                className={clsx(
                  'text-sm leading-none',
                  isSelected
                    ? 'text-white dark:text-gray-900 font-semibold'
                    : isTodayDate
                    ? 'text-blue-500 font-semibold'
                    : dayOfWeek === 0
                    ? 'text-red-400'
                    : dayOfWeek === 6
                    ? 'text-blue-400'
                    : 'text-gray-700 dark:text-gray-300'
                )}
              >
                {format(day, 'd')}
              </span>
              {hasTasks && (
                <span
                  className={clsx(
                    'h-1 w-1 rounded-full',
                    isSelected ? 'bg-white dark:bg-gray-900' : 'bg-gray-400 dark:bg-gray-500'
                  )}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day tasks */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
          {format(selectedDate, 'M月d日(EEE)', { locale: ja })}のタスク
        </h2>
        {selectedTasks.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-8">
            この日のタスクはありません
          </p>
        ) : (
          <div className="space-y-2">
            {selectedTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>

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

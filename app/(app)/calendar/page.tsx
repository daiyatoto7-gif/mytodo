'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
} from 'date-fns'
import { ja } from 'date-fns/locale'
import { clsx } from 'clsx'
import TaskCard from '@/components/TaskCard'
import AddTaskSheet from '@/components/AddTaskSheet'
import FAB from '@/components/FAB'
import { useTasks, useCategories, useGoogleCalendarEvents } from '@/hooks/useTaskData'
import type { GoogleCalendarEvent } from '@/lib/google-calendar'

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

const PRIORITY_DOT_COLOR: Record<string, string> = {
  high: 'bg-red-400',
  medium: 'bg-yellow-400',
  low: 'bg-green-400',
}

function getEventDate(event: GoogleCalendarEvent): string | null {
  return event.start.date ?? event.start.dateTime?.slice(0, 10) ?? null
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const { tasks, refresh } = useTasks()
  const { categories } = useCategories()
  const { googleEvents, refreshEvents } = useGoogleCalendarEvents(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1
  )

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPadding = getDay(monthStart)

  const isCurrentMonth = isSameMonth(currentMonth, new Date())

  function getTasksForDate(date: Date) {
    return tasks.filter((t) => t.due_date && isSameDay(new Date(t.due_date), date))
  }

  function getGoogleEventsForDate(date: Date): GoogleCalendarEvent[] {
    const dateStr = format(date, 'yyyy-MM-dd')
    return googleEvents.filter((e) => getEventDate(e) === dateStr)
  }

  const selectedTasks = getTasksForDate(selectedDate)
  const selectedGoogleEvents = getGoogleEventsForDate(selectedDate)

  function goToToday() {
    const today = new Date()
    setCurrentMonth(today)
    setSelectedDate(today)
  }

  function formatEventTime(event: GoogleCalendarEvent): string | null {
    if (!event.start.dateTime) return null
    return format(new Date(event.start.dateTime), 'HH:mm', { locale: ja })
  }

  function handleMonthChange(newMonth: Date) {
    setCurrentMonth(newMonth)
  }

  return (
    <div className="px-4 pt-12">
      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {format(currentMonth, 'yyyy年M月', { locale: ja })}
          </h1>
          {!isCurrentMonth && (
            <button
              onClick={goToToday}
              className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              今日
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleMonthChange(subMonths(currentMonth, 1))}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleMonthChange(addMonths(currentMonth, 1))}
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
              i === 0
                ? 'text-red-400'
                : i === 6
                ? 'text-blue-400'
                : 'text-gray-400 dark:text-gray-500'
            )}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden mb-6">
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} className="bg-white dark:bg-gray-950 h-12" />
        ))}
        {days.map((day) => {
          const isSelected = isSameDay(day, selectedDate)
          const dayTasks = getTasksForDate(day)
          const dayGoogleEvents = getGoogleEventsForDate(day)
          const isTodayDate = isToday(day)
          const dayOfWeek = getDay(day)
          const incompleteTasks = dayTasks.filter((t) => !t.is_completed)
          const taskDots = incompleteTasks.slice(0, 2)
          const hasGoogleEvents = dayGoogleEvents.length > 0
          const totalExtra = incompleteTasks.length - taskDots.length + (hasGoogleEvents && incompleteTasks.length >= 2 ? dayGoogleEvents.length : 0)

          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={clsx(
                'bg-white dark:bg-gray-950 h-12 flex flex-col items-center justify-center gap-0.5 transition-colors',
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

              {/* Task + Google event dots */}
              {(incompleteTasks.length > 0 || hasGoogleEvents) && (
                <div className="flex items-center gap-0.5">
                  {taskDots.map((t) => (
                    <span
                      key={t.id}
                      className={clsx(
                        'h-1 w-1 rounded-full',
                        isSelected
                          ? 'bg-white dark:bg-gray-900'
                          : PRIORITY_DOT_COLOR[t.priority]
                      )}
                    />
                  ))}
                  {hasGoogleEvents && incompleteTasks.length < 2 && (
                    <span
                      className={clsx(
                        'h-1 w-1 rounded-full',
                        isSelected ? 'bg-white dark:bg-gray-900' : 'bg-purple-400'
                      )}
                    />
                  )}
                  {totalExtra > 0 && (
                    <span
                      className={clsx(
                        'text-[8px] leading-none font-bold',
                        isSelected
                          ? 'text-white dark:text-gray-900'
                          : 'text-gray-400 dark:text-gray-500'
                      )}
                    >
                      +{totalExtra}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day panel */}
      <div className="mb-24">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
          {format(selectedDate, 'M月d日(EEE)', { locale: ja })}のタスク
          {selectedTasks.length > 0 && (
            <span className="ml-1.5 text-xs text-gray-400">
              ({selectedTasks.filter((t) => t.is_completed).length}/{selectedTasks.length} 完了)
            </span>
          )}
        </h2>

        {/* mytodo tasks */}
        {selectedTasks.length === 0 && selectedGoogleEvents.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-8">
            この日の予定はありません
          </p>
        ) : (
          <div className="space-y-2">
            {selectedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={() => { refresh(); refreshEvents() }}
              />
            ))}

            {/* Google Calendar events */}
            {selectedGoogleEvents.length > 0 && (
              <div className="space-y-1.5 mt-3">
                <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                  <CalendarDays className="h-3 w-3" />
                  Googleカレンダー
                </p>
                {selectedGoogleEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30"
                  >
                    <span className="h-2 w-2 rounded-full bg-purple-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 dark:text-gray-200 truncate">
                        {event.summary}
                      </p>
                    </div>
                    {formatEventTime(event) && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                        {formatEventTime(event)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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

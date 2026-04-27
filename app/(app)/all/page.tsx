'use client'

import { useState } from 'react'
import { Search, ArrowUpDown } from 'lucide-react'
import TaskCard from '@/components/TaskCard'
import AddTaskSheet from '@/components/AddTaskSheet'
import FAB from '@/components/FAB'
import { useTasks, useCategories } from '@/hooks/useTaskData'
import type { Priority } from '@/types'

type StatusFilter = 'all' | 'incomplete' | 'completed'
type SortKey = 'created' | 'due_date' | 'priority'

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

const SORT_LABELS: Record<SortKey, string> = {
  created: '作成日順',
  due_date: '期限日順',
  priority: '優先度順',
}

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
]

export default function AllPage() {
  const { tasks, refresh } = useTasks()
  const { categories } = useCategories()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('created')

  function cycleSort() {
    const keys: SortKey[] = ['created', 'due_date', 'priority']
    setSortKey((prev) => {
      const idx = keys.indexOf(prev)
      return keys[(idx + 1) % keys.length]
    })
  }

  const filtered = tasks
    .filter((t) => {
      if (statusFilter === 'incomplete' && t.is_completed) return false
      if (statusFilter === 'completed' && !t.is_completed) return false
      if (categoryFilter && t.category_id !== categoryFilter) return false
      if (priorityFilter && t.priority !== priorityFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          t.title.toLowerCase().includes(q) ||
          (t.memo?.toLowerCase().includes(q) ?? false)
        )
      }
      return true
    })
    .sort((a, b) => {
      if (sortKey === 'priority') {
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      }
      if (sortKey === 'due_date') {
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return a.due_date.localeCompare(b.due_date)
      }
      // created (default): newest first
      return b.created_at.localeCompare(a.created_at)
    })

  return (
    <div className="px-4 pt-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">すべて</h1>
        <button
          onClick={cycleSort}
          className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          {SORT_LABELS[sortKey]}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="検索..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
        />
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
        <div className="space-y-2">
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task} onUpdate={refresh} />
          ))}
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

'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import TaskCard from '@/components/TaskCard'
import AddTaskSheet from '@/components/AddTaskSheet'
import FAB from '@/components/FAB'
import { getTasks } from '@/app/actions/tasks'
import { getCategories } from '@/app/actions/categories'
import type { Task, Category } from '@/types'

export default function AllPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'incomplete' | 'completed'>('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search, setSearch] = useState('')

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

  const filtered = tasks.filter((t) => {
    if (filter === 'incomplete' && t.is_completed) return false
    if (filter === 'completed' && !t.is_completed) return false
    if (categoryFilter && t.category_id !== categoryFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        t.title.toLowerCase().includes(q) ||
        (t.memo?.toLowerCase().includes(q) ?? false)
      )
    }
    return true
  })

  return (
    <div className="px-4 pt-12">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">すべて</h1>

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

      {/* Filter tabs */}
      <div className="flex gap-1 mb-3 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
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

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
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

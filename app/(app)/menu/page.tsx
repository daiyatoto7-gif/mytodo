'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { signOut } from '@/app/actions/auth'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/app/actions/categories'
import type { Category } from '@/types'

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6B7280',
]

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  async function loadCategories() {
    const data = await getCategories()
    setCategories(data as Category[])
  }

  useEffect(() => {
    loadCategories()
  }, [])

  async function handleCreate() {
    if (!newName.trim()) return
    await createCategory(newName.trim(), newColor)
    setIsAdding(false)
    setNewName('')
    setNewColor(PRESET_COLORS[0])
    loadCategories()
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) return
    await updateCategory(id, { name: editName.trim(), color: editColor })
    setEditingId(null)
    loadCategories()
  }

  async function handleDelete(id: string) {
    if (confirm('このカテゴリを削除しますか？関連するタスクのカテゴリは解除されます。')) {
      await deleteCategory(id)
      loadCategories()
    }
  }

  return (
    <div className="px-4 pt-12 pb-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">メニュー</h1>

      {/* Categories section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            カテゴリ
          </h2>
          <button
            onClick={() => setIsAdding(true)}
            className="h-7 w-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          {/* Add form */}
          {isAdding && (
            <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="カテゴリ名"
                autoFocus
                className="flex-1 text-sm bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600"
              />
              <div className="flex gap-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={`h-5 w-5 rounded-full transition-transform ${newColor === c ? 'scale-125' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button onClick={handleCreate} className="text-gray-900 dark:text-white">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={() => setIsAdding(false)} className="text-gray-400">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800"
            >
              {editingId === cat.id ? (
                <>
                  <span
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: editColor }}
                  />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                    className="flex-1 text-sm bg-transparent outline-none text-gray-900 dark:text-white"
                  />
                  <div className="flex gap-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setEditColor(c)}
                        className={`h-4 w-4 rounded-full transition-transform ${editColor === c ? 'scale-125' : ''}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <button onClick={() => handleUpdate(cat.id)} className="text-gray-900 dark:text-white">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-gray-400">
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <span
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="flex-1 text-sm text-gray-900 dark:text-white">{cat.name}</span>
                  <button
                    onClick={() => {
                      setEditingId(cat.id)
                      setEditName(cat.name)
                      setEditColor(cat.color)
                    }}
                    className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Account section */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          アカウント
        </h2>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full text-left p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            ログアウト
          </button>
        </form>
      </section>
    </div>
  )
}

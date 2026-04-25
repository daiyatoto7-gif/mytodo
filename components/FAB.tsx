'use client'

import { Plus } from 'lucide-react'

interface FABProps {
  onClick: () => void
}

export default function FAB({ onClick }: FABProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-30 h-14 w-14 rounded-full bg-gray-900 dark:bg-white shadow-lg flex items-center justify-center hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors active:scale-95"
      aria-label="タスクを追加"
    >
      <Plus className="h-6 w-6 text-white dark:text-gray-900" strokeWidth={2.5} />
    </button>
  )
}

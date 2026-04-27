'use client'

import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'

export default function NotificationBanner() {
  const { state, requestPermission } = useNotification()
  const [dismissed, setDismissed] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)

  // Only show when permission is not yet determined and user hasn't dismissed
  if (state !== 'default' || dismissed) return null

  const isIOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent)

  const isStandalone =
    typeof window !== 'undefined' &&
    (window.navigator as unknown as { standalone?: boolean }).standalone === true

  // On iOS, only show if running as installed PWA (standalone mode)
  if (isIOS && !isStandalone) return null

  async function handleAllow() {
    setIsRequesting(true)
    await requestPermission()
    setIsRequesting(false)
  }

  return (
    <div className="mx-4 mt-3 flex items-start gap-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-4 py-3">
      <Bell className="h-4 w-4 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-blue-800 dark:text-blue-300">通知を有効にする</p>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
          リマインダーをプッシュ通知で受け取れます
        </p>
        <button
          onClick={handleAllow}
          disabled={isRequesting}
          className="mt-2 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-60 transition-colors px-3 py-1.5 rounded-lg"
        >
          {isRequesting ? '設定中...' : '許可する'}
        </button>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-blue-400 dark:text-blue-500 hover:text-blue-600 dark:hover:text-blue-300 transition-colors flex-shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

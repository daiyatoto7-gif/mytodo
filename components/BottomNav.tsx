'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sun, List, Calendar, Menu } from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { href: '/today', label: '今日', icon: Sun },
  { href: '/all', label: 'すべて', icon: List },
  { href: '/calendar', label: 'カレンダー', icon: Calendar },
  { href: '/menu', label: 'メニュー', icon: Menu },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 safe-area-pb">
      <div className="max-w-[600px] mx-auto flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors',
                isActive
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-400 dark:text-gray-500'
              )}
            >
              <Icon
                className={clsx(
                  'h-5 w-5 transition-all',
                  isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'
                )}
              />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

import BottomNav from '@/components/BottomNav'
import NotificationBanner from '@/components/NotificationBanner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="max-w-[600px] mx-auto pb-24">
        <NotificationBanner />
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

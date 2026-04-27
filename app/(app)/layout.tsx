import BottomNav from '@/components/BottomNav'
import NotificationBanner from '@/components/NotificationBanner'
import SWRProvider from '@/components/SWRProvider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SWRProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <main className="max-w-[600px] mx-auto pb-24">
          <NotificationBanner />
          {children}
        </main>
        <BottomNav />
      </div>
    </SWRProvider>
  )
}

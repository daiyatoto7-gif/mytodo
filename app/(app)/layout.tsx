import BottomNav from '@/components/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="max-w-[600px] mx-auto pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

import Navbar from '@/components/layout/Navbar'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'

export const dynamic = 'force-dynamic'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="flex h-[calc(100vh-50px)] lg:h-[calc(100vh-70px)] mt-[50px] lg:mt-[70px] overflow-hidden">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto bg-surface">
          {children}
        </main>
      </div>
    </>
  )
}

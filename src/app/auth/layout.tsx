import Navbar from '@/components/layout/Navbar'

export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="flex items-center justify-center px-5 md:px-10 pt-[80px] lg:pt-[100px] pb-12 min-h-screen">
        {children}
      </div>
    </div>
  )
}

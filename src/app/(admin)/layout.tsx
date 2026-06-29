import Link from 'next/link'
import AdminNav from './AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside className="w-[300px] shrink-0 border-r border-surface-border flex flex-col">
        <div className="p-5 border-b border-surface-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center text-black text-xs">A</div>
            <span className="text-white text-[18px] leading-none">Admin</span>
          </Link>
        </div>
        <AdminNav />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

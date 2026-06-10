import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Top bar */}
      <div className="p-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center font-bold text-black text-sm">A</div>
          <span className="font-bold text-white text-lg">Academy</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        {children}
      </div>
    </div>
  )
}

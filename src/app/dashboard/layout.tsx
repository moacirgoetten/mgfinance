import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="flex h-screen bg-[#050a14] overflow-hidden">
      <div className="hidden md:flex">
        <Sidebar user={user} />
      </div>

      <main className="flex-1 overflow-y-auto">
        <MobileNav user={user} />
        {children}
      </main>
    </div>
  )
}

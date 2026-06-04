import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'
import MobileHeader from '@/components/layout/MobileHeader'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="flex h-screen bg-[#050a14] overflow-hidden">
      {/* Sidebar — visível só em telas médias+ */}
      <div className="hidden md:flex">
        <Sidebar user={user} />
      </div>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <MobileHeader />
        {children}
      </main>

      {/* Bottom nav — visível só no celular */}
      <BottomNav />
    </div>
  )
}

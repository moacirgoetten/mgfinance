'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import MobileDrawer from './MobileDrawer'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/transactions': 'Transações',
  '/dashboard/investments': 'Investimentos',
  '/dashboard/budgets': 'Orçamentos',
  '/dashboard/goals': 'Metas',
  '/dashboard/charts': 'Gráficos',
  '/dashboard/history': 'Histórico',
  '/dashboard/settings': 'Configurações',
}

export default function MobileNav({ user }: { user: SupabaseUser }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const title = titles[pathname] || 'MGFinance'

  return (
    <>
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0a1628] border-b border-[#1a3a5c]/60 sticky top-0 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white transition"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-sm font-semibold text-slate-300 absolute left-1/2 -translate-x-1/2">{title}</h1>
        <div className="w-9" />
      </header>

      <MobileDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} user={user} />
    </>
  )
}

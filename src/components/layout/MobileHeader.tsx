'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Settings } from 'lucide-react'

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/transactions': 'Transações',
  '/dashboard/budgets': 'Orçamentos',
  '/dashboard/goals': 'Metas',
  '/dashboard/charts': 'Gráficos',
  '/dashboard/history': 'Histórico',
  '/dashboard/settings': 'Configurações',
}

export default function MobileHeader() {
  const pathname = usePathname()
  const title = titles[pathname] || 'MGFinance'

  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0a1628] border-b border-[#1a3a5c]/60 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <Image
          src="/logo.png"
          alt="MGFinance"
          width={28}
          height={28}
          className="rounded-lg object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <span className="font-bold text-white text-base">MGFinance</span>
      </div>
      <h1 className="text-sm font-semibold text-slate-300 absolute left-1/2 -translate-x-1/2">{title}</h1>
      <Link href="/dashboard/settings" className="p-1.5 rounded-lg text-slate-400 hover:text-white transition">
        <Settings className="w-5 h-5" />
      </Link>
    </header>
  )
}

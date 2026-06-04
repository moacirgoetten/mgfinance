'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, ArrowLeftRight, Target, BarChart2, History } from 'lucide-react'

const items = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/dashboard/transactions', label: 'Transações', icon: ArrowLeftRight },
  { href: '/dashboard/goals', label: 'Metas', icon: Target },
  { href: '/dashboard/charts', label: 'Gráficos', icon: BarChart2 },
  { href: '/dashboard/history', label: 'Histórico', icon: History },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0a1628] border-t border-[#1a3a5c]/60 flex items-center justify-around px-2 pb-safe">
      {items.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all min-w-0',
              isActive ? 'text-blue-400' : 'text-slate-500'
            )}
          >
            <Icon className={cn('w-5 h-5 shrink-0', isActive && 'scale-110')} />
            <span className="text-[10px] font-medium truncate">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

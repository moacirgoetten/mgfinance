'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  X, LayoutDashboard, ArrowLeftRight, LineChart,
  Wallet, Target, BarChart2, History, Settings, LogOut,
} from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/transactions', label: 'Transações', icon: ArrowLeftRight },
  { href: '/dashboard/investments', label: 'Investimentos', icon: LineChart },
  { href: '/dashboard/budgets', label: 'Orçamentos', icon: Wallet },
  { href: '/dashboard/goals', label: 'Metas', icon: Target },
  { href: '/dashboard/charts', label: 'Gráficos', icon: BarChart2 },
  { href: '/dashboard/history', label: 'Histórico', icon: History },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
]

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  user: SupabaseUser
}

export default function MobileDrawer({ isOpen, onClose, user }: MobileDrawerProps) {
  const pathname = usePathname()
  const router = useRouter()

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário'
  const initials = displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/60 md:hidden transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-[#0a1628] border-r border-[#1a3a5c]/60 flex flex-col md:hidden transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#1a3a5c]/60">
          <span className="font-bold text-white text-lg">MGFinance</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-[#0d1f3c]/50'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-[#1a3a5c]/60">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition w-full"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </div>
    </>
  )
}

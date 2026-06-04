'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { User } from '@supabase/supabase-js'
import { Save, Loader2, User as UserIcon, Wallet } from 'lucide-react'

interface Profile {
  id: string
  full_name: string | null
  monthly_salary: number | null
  currency: string | null
}

interface Props {
  user: User
  profile: Profile | null
}

export default function SettingsClient({ user, profile }: Props) {
  const supabase = createClient()
  const [name, setName] = useState(profile?.full_name || user.user_metadata?.full_name || '')
  const [salary, setSalary] = useState(profile?.monthly_salary ? String(profile.monthly_salary) : '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: name,
      monthly_salary: salary ? parseFloat(salary) : null,
      updated_at: new Date().toISOString(),
    })

    await supabase.auth.updateUser({ data: { full_name: name } })

    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold text-white mb-6">Configurações</h1>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Perfil */}
        <div className="bg-[#0a1628]/80 border border-[#1a3a5c]/60 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserIcon className="w-4 h-4 text-blue-400" />
            <h2 className="font-semibold text-white">Perfil</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome completo</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full px-3 py-2 bg-[#0d1f3c] border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
              <input
                value={user.email || ''}
                disabled
                className="w-full px-3 py-2 bg-[#0d1f3c]/30 border border-[#1a3a5c]/60 rounded-lg text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Financeiro */}
        <div className="bg-[#0a1628]/80 border border-[#1a3a5c]/60 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-4 h-4 text-green-400" />
            <h2 className="font-semibold text-white">Financeiro</h2>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Salário mensal líquido (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={salary}
              onChange={e => setSalary(e.target.value)}
              placeholder="Ex: 3500,00"
              className="w-full px-3 py-2 bg-[#0d1f3c] border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Usado para calcular sua taxa de poupança e % do salário gasto no dashboard.
            </p>
            {salary && (
              <p className="text-xs text-green-400 mt-1">
                Salário: {formatCurrency(parseFloat(salary))} / mês
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
            : saved
            ? '✓ Salvo!'
            : <><Save className="w-4 h-4" /> Salvar configurações</>
          }
        </button>
      </form>
    </div>
  )
}

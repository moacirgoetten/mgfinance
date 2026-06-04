'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { User } from '@supabase/supabase-js'
import { Save, Loader2, User as UserIcon, Wallet, Calendar } from 'lucide-react'

interface Profile {
  id: string
  full_name: string | null
  monthly_salary: number | null
  salary_day: number | null
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
  const [salaryDay, setSalaryDay] = useState(profile?.salary_day ? String(profile.salary_day) : '5')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const salaryValue = salary ? parseFloat(salary) : null
    const dayValue = parseInt(salaryDay) || 5

    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: name,
      monthly_salary: salaryValue,
      salary_day: dayValue,
      updated_at: new Date().toISOString(),
    })

    await supabase.auth.updateUser({ data: { full_name: name } })

    if (salaryValue && salaryValue > 0) {
      await ensureSalaryTransaction(salaryValue, dayValue)
    }

    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function ensureSalaryTransaction(salaryValue: number, dayValue: number) {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = Math.min(dayValue, new Date(year, month, 0).getDate())
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    // Verifica se já existe entrada de salário este mês
    const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('category', 'income')
      .eq('subcategory', 'Salário')
      .gte('date', `${year}-${String(month).padStart(2, '0')}-01`)
      .lte('date', new Date(year, month, 0).toISOString().split('T')[0])
      .limit(1)

    if (!existing || existing.length === 0) {
      await supabase.from('transactions').insert({
        user_id: user.id,
        amount: salaryValue,
        description: 'Salário',
        category: 'income',
        subcategory: 'Salário',
        date: dateStr,
        is_recurring: true,
        notes: 'Adicionado automaticamente via Configurações',
        tags: ['salário', 'automático'],
      })
      setMessage(`✓ Salário de ${formatCurrency(salaryValue)} adicionado em ${dateStr.split('-').reverse().join('/')}`)
    } else {
      setMessage('Salário já registrado neste mês.')
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-xl">
      <h1 className="text-xl md:text-2xl font-bold text-white mb-6">Configurações</h1>

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

        {/* Salário */}
        <div className="bg-[#0a1628]/80 border border-[#1a3a5c]/60 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-4 h-4 text-green-400" />
            <h2 className="font-semibold text-white">Salário mensal</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Valor líquido (R$)
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
              {salary && (
                <p className="text-xs text-green-400 mt-1">
                  {formatCurrency(parseFloat(salary))} / mês
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                Dia de recebimento
              </label>
              <select
                value={salaryDay}
                onChange={e => setSalaryDay(e.target.value)}
                className="w-full px-3 py-2 bg-[#0d1f3c] border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>
                    Todo dia {d}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1.5">
                O salário será adicionado automaticamente às entradas todo dia {salaryDay} de cada mês.
              </p>
            </div>
          </div>
        </div>

        {message && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-400">{message}</p>
          </div>
        )}

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

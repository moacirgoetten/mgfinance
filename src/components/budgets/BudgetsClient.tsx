'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Transaction, Budget } from '@/types'
import { formatCurrency, getMonthName } from '@/lib/utils'
import { Plus, ChevronLeft, ChevronRight, Trash2, AlertTriangle, CheckCircle } from 'lucide-react'

interface Props {
  transactions: Transaction[]
  budgets: Budget[]
  month: number
  year: number
  userId: string
}

const BUDGET_CATEGORIES = [
  { value: 'variable_expense', label: 'Gastos Variáveis (total)', color: '#f97316' },
  { value: 'fixed_expense', label: 'Gastos Fixos (total)', color: '#ef4444' },
  { value: 'investment', label: 'Investimentos (total)', color: '#6366f1' },
  { value: 'Alimentação', label: 'Alimentação', color: '#f97316' },
  { value: 'Transporte', label: 'Transporte', color: '#f59e0b' },
  { value: 'Lazer', label: 'Lazer', color: '#8b5cf6' },
  { value: 'Saúde', label: 'Saúde', color: '#06b6d4' },
  { value: 'Roupas', label: 'Roupas', color: '#ec4899' },
  { value: 'Educação', label: 'Educação', color: '#14b8a6' },
  { value: 'Restaurante', label: 'Restaurante', color: '#f97316' },
]

export default function BudgetsClient({ transactions, budgets: initialBudgets, month, year, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ category: 'variable_expense', amount: '' })
  const [loading, setLoading] = useState(false)

  function navigateMonth(dir: number) {
    let m = month + dir, y = year
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    router.push(`/dashboard/budgets?month=${m}&year=${y}`)
  }

  const spent = useMemo(() => {
    const totals: Record<string, number> = {}
    transactions.forEach(t => {
      if (t.category === 'income') return
      totals[t.category] = (totals[t.category] || 0) + Number(t.amount)
      if (t.subcategory) {
        totals[t.subcategory] = (totals[t.subcategory] || 0) + Number(t.amount)
      }
    })
    return totals
  }, [transactions])

  async function handleAddBudget(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const existing = budgets.find(b => b.category === form.category)
    if (existing) {
      const { data } = await supabase.from('budgets').update({ amount: parseFloat(form.amount) }).eq('id', existing.id).select().single()
      if (data) setBudgets(prev => prev.map(b => b.id === existing.id ? data : b))
    } else {
      const { data } = await supabase.from('budgets').insert({
        user_id: userId, category: form.category, amount: parseFloat(form.amount), month, year,
      }).select().single()
      if (data) setBudgets(prev => [...prev, data])
    }

    setLoading(false)
    setShowForm(false)
    setForm({ category: 'variable_expense', amount: '' })
  }

  async function handleDelete(id: string) {
    await supabase.from('budgets').delete().eq('id', id)
    setBudgets(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Orçamentos</h1>
          <div className="flex items-center gap-1 mt-1">
            <button onClick={() => navigateMonth(-1)} className="p-1 hover:bg-[#0d1f3c] rounded transition text-slate-400 hover:text-white">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-slate-300 text-sm font-medium">{getMonthName(month)} {year}</span>
            <button onClick={() => navigateMonth(1)} className="p-1 hover:bg-[#0d1f3c] rounded transition text-slate-400 hover:text-white">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Definir orçamento
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddBudget} className="bg-[#0a1628]/80 border border-[#1a3a5c]/60 rounded-2xl p-5 mb-6 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Categoria</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full px-3 py-2 bg-[#0d1f3c] border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {BUDGET_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="w-36">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Limite (R$)</label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              required
              placeholder="0,00"
              className="w-full px-3 py-2 bg-[#0d1f3c] border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition">
            Salvar
          </button>
        </form>
      )}

      {budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <p className="text-lg mb-2">Nenhum orçamento definido</p>
          <p className="text-sm">Defina limites por categoria para controlar seus gastos</p>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map(b => {
            const spentAmount = spent[b.category] || 0
            const pct = Math.min(100, Math.round((spentAmount / Number(b.amount)) * 100))
            const isOver = spentAmount > Number(b.amount)
            const isWarning = pct >= 80 && !isOver

            return (
              <div key={b.id} className={`bg-[#0a1628]/80 border rounded-2xl p-5 ${isOver ? 'border-red-500/50' : isWarning ? 'border-yellow-500/30' : 'border-[#1a3a5c]/60'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isOver ? (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                    <span className="font-medium text-white text-sm">
                      {BUDGET_CATEGORIES.find(c => c.value === b.category)?.label || b.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${isOver ? 'text-red-400' : 'text-slate-300'}`}>
                      {formatCurrency(spentAmount)} / {formatCurrency(Number(b.amount))}
                    </span>
                    <button onClick={() => handleDelete(b.id)} className="text-slate-500 hover:text-red-400 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="w-full bg-[#0d1f3c] rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${isOver ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-xs text-slate-500">{pct}% usado</span>
                  {isOver && (
                    <span className="text-xs text-red-400 font-medium">
                      Excedeu {formatCurrency(spentAmount - Number(b.amount))}
                    </span>
                  )}
                  {isWarning && (
                    <span className="text-xs text-yellow-400 font-medium">Atenção: quase no limite!</span>
                  )}
                  {!isOver && !isWarning && (
                    <span className="text-xs text-slate-500">Resta {formatCurrency(Number(b.amount) - spentAmount)}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Transaction, TransactionCategory } from '@/types'
import { formatCurrency, getMonthName, getCategoryColor, getCategoryLabel } from '@/lib/utils'
import {
  Plus, ChevronLeft, ChevronRight, Trash2, Edit2, X,
  Loader2, Search, Filter,
} from 'lucide-react'

interface Props {
  transactions: Transaction[]
  month: number
  year: number
  userId: string
  openNew: boolean
}

const SUBCATEGORIES: Record<TransactionCategory, string[]> = {
  income: ['Salário', 'Freelance', 'Aluguel recebido', 'Dividendos', 'Presente', 'Outros'],
  fixed_expense: ['Aluguel', 'Condomínio', 'Internet', 'Água', 'Luz', 'Gás', 'Plano de saúde', 'Academia', 'Streaming', 'Outros'],
  variable_expense: ['Alimentação', 'Supermercado', 'Transporte', 'Saúde', 'Lazer', 'Roupas', 'Educação', 'Restaurante', 'Viagem', 'Outros'],
  investment: ['Ações', 'FIIs', 'Tesouro Direto', 'CDB', 'Poupança', 'Criptomoedas', 'ETFs', 'Outros'],
}

const EMPTY_FORM = {
  description: '',
  amount: '',
  category: 'variable_expense' as TransactionCategory,
  subcategory: '',
  date: new Date().toISOString().split('T')[0],
  is_recurring: false,
  notes: '',
  tags: '',
}

export default function TransactionsClient({ transactions: initial, month, year, userId, openNew }: Props) {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>(initial)
  const [showModal, setShowModal] = useState(openNew)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const supabase = createClient()

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = t.description.toLowerCase().includes(search.toLowerCase())
      const matchCategory = filterCategory === 'all' || t.category === filterCategory
      return matchSearch && matchCategory
    })
  }, [transactions, search, filterCategory])

  const grouped = useMemo(() => {
    const groups: Record<string, Transaction[]> = {}
    filtered.forEach(t => {
      if (!groups[t.date]) groups[t.date] = []
      groups[t.date].push(t)
    })
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }, [filtered])

  const stats = useMemo(() => ({
    income: transactions.filter(t => t.category === 'income').reduce((s, t) => s + Number(t.amount), 0),
    expenses: transactions.filter(t => t.category !== 'income' && t.category !== 'investment').reduce((s, t) => s + Number(t.amount), 0),
    investments: transactions.filter(t => t.category === 'investment').reduce((s, t) => s + Number(t.amount), 0),
  }), [transactions])

  function navigateMonth(dir: number) {
    let m = month + dir
    let y = year
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    router.push(`/dashboard/transactions?month=${m}&year=${y}`)
  }

  function openEdit(t: Transaction) {
    setForm({
      description: t.description,
      amount: String(t.amount),
      category: t.category,
      subcategory: t.subcategory || '',
      date: t.date,
      is_recurring: t.is_recurring,
      notes: t.notes || '',
      tags: t.tags.join(', '),
    })
    setEditingId(t.id)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const payload = {
      user_id: userId,
      description: form.description,
      amount: parseFloat(form.amount),
      category: form.category,
      subcategory: form.subcategory || null,
      date: form.date,
      is_recurring: form.is_recurring,
      notes: form.notes || null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }

    if (editingId) {
      const { data, error } = await supabase.from('transactions').update(payload).eq('id', editingId).select().single()
      if (!error && data) {
        setTransactions(prev => prev.map(t => t.id === editingId ? data : t))
      }
    } else {
      const { data, error } = await supabase.from('transactions').insert(payload).select().single()
      if (!error && data) {
        setTransactions(prev => [data, ...prev])
      }
    }

    setLoading(false)
    closeModal()
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (!error) {
      setTransactions(prev => prev.filter(t => t.id !== id))
    }
    setDeleteId(null)
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Transações</h1>
          <div className="flex items-center gap-2 mt-1">
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
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Nova transação
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
        {[
          { label: 'Entradas', value: stats.income, color: 'text-green-400' },
          { label: 'Gastos', value: stats.expenses, color: 'text-red-400' },
          { label: 'Investimentos', value: stats.investments, color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#0a1628]/80 border border-[#1a3a5c]/60 rounded-xl p-2 md:p-4 overflow-hidden min-w-0">
            <p className="text-[10px] md:text-xs text-slate-400 mb-1 truncate">{s.label}</p>
            <p className={`text-sm md:text-lg font-bold ${s.color} truncate`}>{formatCurrency(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar transação..."
            className="w-full pl-9 pr-4 py-2 bg-[#0a1628] border border-[#1a3a5c]/60 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2 bg-[#0a1628] border border-[#1a3a5c]/60 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todas</option>
          <option value="income">Entradas</option>
          <option value="fixed_expense">Fixos</option>
          <option value="variable_expense">Variáveis</option>
          <option value="investment">Investimentos</option>
        </select>
      </div>

      {/* Transaction list grouped by day */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <p className="text-lg mb-2">Nenhuma transação encontrada</p>
          <button onClick={() => setShowModal(true)} className="text-blue-400 hover:underline text-sm">
            Adicionar a primeira transação
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(([date, dayTransactions]) => {
            const d = new Date(date + 'T00:00:00')
            const dayTotal = dayTransactions.reduce((s, t) => {
              return s + (t.category === 'income' ? Number(t.amount) : -Number(t.amount))
            }, 0)
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    {d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                  </span>
                  <span className={`text-xs font-semibold ${dayTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {dayTotal >= 0 ? '+' : ''}{formatCurrency(dayTotal)}
                  </span>
                </div>
                <div className="bg-[#0a1628]/80 border border-[#1a3a5c]/60 rounded-xl overflow-hidden">
                  {dayTransactions.map((t, i) => (
                    <div
                      key={t.id}
                      className={`flex items-center justify-between px-4 py-3 ${i !== dayTransactions.length - 1 ? 'border-b border-[#1a3a5c]/60/50' : ''} group hover:bg-[#0d1f3c]/20 transition`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: getCategoryColor(t.category) }} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{t.description}</p>
                          <p className="text-xs text-slate-500">
                            {getCategoryLabel(t.category)}{t.subcategory ? ` · ${t.subcategory}` : ''}
                            {t.is_recurring && ' · Recorrente'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className={`text-sm font-semibold ${t.category === 'income' ? 'text-green-400' : t.category === 'investment' ? 'text-blue-400' : 'text-red-400'}`}>
                          {t.category === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-slate-600 rounded-lg transition">
                            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                          <button onClick={() => setDeleteId(t.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg transition">
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Transaction Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm"
          onTouchMove={e => e.stopPropagation()}
        >
          <div className="bg-[#0a1628] border border-[#1a3a5c]/60 rounded-t-2xl md:rounded-2xl w-full md:max-w-md flex flex-col"
            style={{ maxHeight: 'calc(100dvh - 80px)' }}
          >
            <div className="flex items-center justify-between p-5 border-b border-[#1a3a5c]/60 shrink-0">
              <h2 className="font-semibold text-white">{editingId ? 'Editar transação' : 'Nova transação'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-5 space-y-4 flex-1"
              style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Descrição</label>
                  <input
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    required
                    placeholder="Ex: Conta de luz"
                    className="w-full px-3 py-2 bg-[#0d1f3c] border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    required
                    placeholder="0,00"
                    className="w-full px-3 py-2 bg-[#0d1f3c] border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Data</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-[#0d1f3c] border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Categoria</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as TransactionCategory, subcategory: '' }))}
                    className="w-full px-3 py-2 bg-[#0d1f3c] border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="income">Entrada</option>
                    <option value="fixed_expense">Gasto Fixo</option>
                    <option value="variable_expense">Gasto Variável</option>
                    <option value="investment">Investimento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Subcategoria</label>
                  <select
                    value={form.subcategory}
                    onChange={e => setForm(f => ({ ...f, subcategory: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#0d1f3c] border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecionar...</option>
                    {SUBCATEGORIES[form.category].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Observação (opcional)</label>
                  <input
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Alguma nota sobre esta transação..."
                    className="w-full px-3 py-2 bg-[#0d1f3c] border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Tags (separadas por vírgula)</label>
                  <input
                    value={form.tags}
                    onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder="viagem, trabalho, família..."
                    className="w-full px-3 py-2 bg-[#0d1f3c] border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_recurring}
                      onChange={e => setForm(f => ({ ...f, is_recurring: e.target.checked }))}
                      className="w-4 h-4 rounded accent-indigo-600"
                    />
                    <span className="text-sm text-slate-300">Gasto recorrente (todo mês)</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 border border-slate-600 hover:bg-[#0d1f3c] text-slate-300 text-sm font-medium rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0a1628] border border-[#1a3a5c]/60 rounded-t-2xl md:rounded-2xl p-6 w-full md:max-w-sm text-center mb-16 md:mb-0">
            <p className="text-white font-semibold mb-2">Excluir transação?</p>
            <p className="text-slate-400 text-sm mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 border border-slate-600 hover:bg-[#0d1f3c] text-slate-300 text-sm rounded-lg transition">
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

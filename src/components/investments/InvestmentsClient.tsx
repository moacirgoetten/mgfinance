'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { InvestmentAsset, InvestmentType, INVESTMENT_TYPES } from '@/types/investments'
import { Plus, Trash2, Edit2, X, Loader2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const EMPTY_FORM = {
  name: '', ticker: '', type: 'acoes' as InvestmentType,
  amount_invested: '', current_value: '', quantity: '',
  purchase_date: '', notes: '',
}

interface Props {
  assets: InvestmentAsset[]
  userId: string
}

export default function InvestmentsClient({ assets: initial, userId }: Props) {
  const supabase = createClient()
  const [assets, setAssets] = useState<InvestmentAsset[]>(initial)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [newValue, setNewValue] = useState('')

  const stats = useMemo(() => {
    const totalInvested = assets.reduce((s, a) => s + Number(a.amount_invested), 0)
    const totalCurrent = assets.reduce((s, a) => s + Number(a.current_value), 0)
    const profit = totalCurrent - totalInvested
    const profitPct = totalInvested > 0 ? (profit / totalInvested) * 100 : 0
    return { totalInvested, totalCurrent, profit, profitPct }
  }, [assets])

  const pieData = useMemo(() => {
    const byType: Record<string, number> = {}
    assets.forEach(a => {
      byType[a.type] = (byType[a.type] || 0) + Number(a.current_value)
    })
    return Object.entries(byType).map(([type, value]) => ({
      name: INVESTMENT_TYPES[type as InvestmentType]?.label || type,
      value,
      color: INVESTMENT_TYPES[type as InvestmentType]?.color || '#64748b',
    }))
  }, [assets])

  const barData = useMemo(() =>
    assets.slice(0, 8).map(a => ({
      name: a.ticker || a.name.slice(0, 8),
      Investido: Number(a.amount_invested),
      Atual: Number(a.current_value),
    })), [assets])

  function openEdit(a: InvestmentAsset) {
    setForm({
      name: a.name, ticker: a.ticker || '', type: a.type,
      amount_invested: String(a.amount_invested),
      current_value: String(a.current_value),
      quantity: a.quantity ? String(a.quantity) : '',
      purchase_date: a.purchase_date || '', notes: a.notes || '',
    })
    setEditingId(a.id)
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
      name: form.name,
      ticker: form.ticker || null,
      type: form.type,
      amount_invested: parseFloat(form.amount_invested),
      current_value: parseFloat(form.current_value || form.amount_invested),
      quantity: form.quantity ? parseFloat(form.quantity) : null,
      purchase_date: form.purchase_date || null,
      notes: form.notes || null,
    }
    if (editingId) {
      const { data } = await supabase.from('investment_assets').update(payload).eq('id', editingId).select().single()
      if (data) setAssets(prev => prev.map(a => a.id === editingId ? data : a))
    } else {
      const { data } = await supabase.from('investment_assets').insert(payload).select().single()
      if (data) setAssets(prev => [data, ...prev])
    }
    setLoading(false)
    closeModal()
  }

  async function handleDelete(id: string) {
    await supabase.from('investment_assets').delete().eq('id', id)
    setAssets(prev => prev.filter(a => a.id !== id))
    setDeleteId(null)
  }

  async function handleUpdateValue(id: string) {
    const val = parseFloat(newValue)
    if (!val || val <= 0) return
    const { data } = await supabase.from('investment_assets').update({ current_value: val }).eq('id', id).select().single()
    if (data) setAssets(prev => prev.map(a => a.id === id ? data : a))
    setUpdatingId(null)
    setNewValue('')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tooltipStyle: any = {
    contentStyle: { background: '#0a1628', border: '1px solid #1a3a5c', borderRadius: '8px', color: '#f1f5f9', fontSize: '12px' },
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Carteira de Investimentos</h1>
          <p className="text-slate-400 text-sm mt-0.5">{assets.length} ativo{assets.length !== 1 ? 's' : ''} cadastrado{assets.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition">
          <Plus className="w-4 h-4" /> Novo ativo
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total investido', value: formatCurrency(stats.totalInvested), color: 'text-slate-200' },
          { label: 'Valor atual', value: formatCurrency(stats.totalCurrent), color: 'text-blue-400' },
          { label: 'Lucro/Prejuízo', value: `${stats.profit >= 0 ? '+' : ''}${formatCurrency(stats.profit)}`, color: stats.profit >= 0 ? 'text-green-400' : 'text-red-400' },
          { label: 'Rentabilidade', value: `${stats.profitPct >= 0 ? '+' : ''}${stats.profitPct.toFixed(2)}%`, color: stats.profitPct >= 0 ? 'text-green-400' : 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#0a1628]/80 border border-[#1a3a5c]/60 rounded-2xl p-3 md:p-4 overflow-hidden">
            <p className="text-[10px] md:text-xs text-slate-400 mb-1 truncate">{s.label}</p>
            <p className={`text-sm md:text-lg font-bold ${s.color} truncate`}>{s.value}</p>
          </div>
        ))}
      </div>

      {assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <p className="text-4xl mb-4">📊</p>
          <p className="text-lg mb-2">Nenhum ativo cadastrado</p>
          <p className="text-sm text-center max-w-xs">Adicione seus investimentos para acompanhar a rentabilidade da sua carteira</p>
        </div>
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            <div className="bg-[#0a1628]/80 border border-[#1a3a5c]/60 rounded-2xl p-5">
              <h2 className="font-semibold text-white mb-4">Alocação por tipo</h2>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value" label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} {...tooltipStyle} />
                  <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#0a1628]/80 border border-[#1a3a5c]/60 rounded-2xl p-5">
              <h2 className="font-semibold text-white mb-4">Investido vs Valor atual</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a3a5c" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} {...tooltipStyle} />
                  <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{v}</span>} />
                  <Bar dataKey="Investido" fill="#334155" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Atual" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Assets list */}
          <div className="bg-[#0a1628]/80 border border-[#1a3a5c]/60 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[#1a3a5c]/60">
              <h2 className="font-semibold text-white">Meus ativos</h2>
            </div>
            <div className="divide-y divide-[#1a3a5c]/40">
              {assets.map(asset => {
                const profit = Number(asset.current_value) - Number(asset.amount_invested)
                const profitPct = Number(asset.amount_invested) > 0 ? (profit / Number(asset.amount_invested)) * 100 : 0
                const typeInfo = INVESTMENT_TYPES[asset.type]
                return (
                  <div key={asset.id} className="p-4 hover:bg-white/[0.02] transition group">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: typeInfo.color + '20' }}>
                          {typeInfo.emoji}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-white text-sm truncate">{asset.name}</p>
                            {asset.ticker && <span className="text-[10px] text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded font-mono">{asset.ticker}</span>}
                          </div>
                          <p className="text-xs text-slate-500">{typeInfo.label}{asset.purchase_date ? ` · desde ${new Date(asset.purchase_date + 'T00:00:00').toLocaleDateString('pt-BR')}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-slate-500">Investido</p>
                          <p className="text-sm text-slate-300">{formatCurrency(Number(asset.amount_invested))}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Atual</p>
                          <p className="text-sm font-semibold text-white">{formatCurrency(Number(asset.current_value))}</p>
                        </div>
                        <div className="text-right w-20">
                          <div className={`flex items-center justify-end gap-0.5 ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {profit >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span className="text-xs font-semibold">{profitPct >= 0 ? '+' : ''}{profitPct.toFixed(1)}%</span>
                          </div>
                          <p className={`text-xs ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                          </p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => { setUpdatingId(asset.id); setNewValue(String(asset.current_value)) }} className="p-1.5 hover:bg-blue-500/20 rounded-lg transition" title="Atualizar valor">
                            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                          </button>
                          <button onClick={() => openEdit(asset)} className="p-1.5 hover:bg-slate-700 rounded-lg transition">
                            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                          <button onClick={() => setDeleteId(asset.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg transition">
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {updatingId === asset.id && (
                      <div className="flex gap-2 mt-3">
                        <div className="flex-1">
                          <label className="text-xs text-slate-400 mb-1 block">Novo valor atual (R$)</label>
                          <input type="number" step="0.01" min="0" value={newValue} onChange={e => setNewValue(e.target.value)} autoFocus className="w-full px-3 py-1.5 bg-[#0d1f3c] border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="flex gap-2 items-end">
                          <button onClick={() => handleUpdateValue(asset.id)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition">Salvar</button>
                          <button onClick={() => { setUpdatingId(null); setNewValue('') }} className="px-3 py-1.5 text-slate-400 hover:text-white text-sm">✕</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0a1628] border border-[#1a3a5c]/60 rounded-2xl w-full max-w-md flex flex-col" style={{ maxHeight: 'calc(100dvh - 120px)' }}>
            <div className="flex items-center justify-between p-5 border-b border-[#1a3a5c]/60 shrink-0">
              <h2 className="font-semibold text-white">{editingId ? 'Editar ativo' : 'Novo ativo'}</h2>
              <button onClick={closeModal}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 flex-1" style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome do ativo</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Ex: Petrobras, Bitcoin, CDB Banco X" className="w-full px-3 py-2 bg-[#0d1f3c] border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Ticker/Código (opcional)</label>
                  <input value={form.ticker} onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))} placeholder="PETR4, BTC, MXRF11" className="w-full px-3 py-2 bg-[#0d1f3c] border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Tipo</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as InvestmentType }))} className="w-full px-3 py-2 bg-[#0d1f3c] border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {Object.entries(INVESTMENT_TYPES).map(([key, val]) => (
                      <option key={key} value={key}>{val.emoji} {val.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Valor investido (R$)</label>
                  <input type="number" step="0.01" min="0" value={form.amount_invested} onChange={e => setForm(f => ({ ...f, amount_invested: e.target.value }))} required placeholder="0,00" className="w-full px-3 py-2 bg-[#0d1f3c] border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Valor atual (R$)</label>
                  <input type="number" step="0.01" min="0" value={form.current_value} onChange={e => setForm(f => ({ ...f, current_value: e.target.value }))} placeholder="Deixe vazio = igual ao investido" className="w-full px-3 py-2 bg-[#0d1f3c] border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Quantidade (opcional)</label>
                  <input type="number" step="any" min="0" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="Ex: 10 ações" className="w-full px-3 py-2 bg-[#0d1f3c] border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Data de compra</label>
                  <input type="date" value={form.purchase_date} onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))} className="w-full px-3 py-2 bg-[#0d1f3c] border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Observação (opcional)</label>
                  <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notas sobre este investimento..." className="w-full px-3 py-2 bg-[#0d1f3c] border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 border border-slate-600 hover:bg-[#0d1f3c] text-slate-300 text-sm font-medium rounded-lg transition">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0a1628] border border-[#1a3a5c]/60 rounded-2xl p-6 w-full max-w-sm text-center">
            <p className="text-white font-semibold mb-2">Excluir ativo?</p>
            <p className="text-slate-400 text-sm mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 border border-slate-600 hover:bg-[#0d1f3c] text-slate-300 text-sm rounded-lg transition">Cancelar</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

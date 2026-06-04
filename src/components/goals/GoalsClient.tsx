'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Goal } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Plus, Trash2, X, Loader2, CheckCircle, Target, Edit2 } from 'lucide-react'

const COLORS = ['#6366f1', '#22c55e', '#f97316', '#06b6d4', '#ec4899', '#f59e0b', '#8b5cf6', '#14b8a6']

const EMPTY_FORM = {
  name: '', description: '', target_amount: '', current_amount: '0',
  deadline: '', color: '#6366f1',
}

interface Props {
  goals: Goal[]
  userId: string
}

export default function GoalsClient({ goals: initial, userId }: Props) {
  const [goals, setGoals] = useState<Goal[]>(initial)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addingProgress, setAddingProgress] = useState<string | null>(null)
  const [progressAmount, setProgressAmount] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  function openEdit(g: Goal) {
    setForm({
      name: g.name, description: g.description || '',
      target_amount: String(g.target_amount),
      current_amount: String(g.current_amount),
      deadline: g.deadline || '', color: g.color,
    })
    setEditingId(g.id)
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
      user_id: userId, name: form.name, description: form.description || null,
      target_amount: parseFloat(form.target_amount),
      current_amount: parseFloat(form.current_amount) || 0,
      deadline: form.deadline || null, color: form.color,
      is_completed: parseFloat(form.current_amount) >= parseFloat(form.target_amount),
    }
    if (editingId) {
      const { data } = await supabase.from('goals').update(payload).eq('id', editingId).select().single()
      if (data) setGoals(prev => prev.map(g => g.id === editingId ? data : g))
    } else {
      const { data } = await supabase.from('goals').insert(payload).select().single()
      if (data) setGoals(prev => [data, ...prev])
    }
    setLoading(false)
    closeModal()
  }

  async function handleDelete(id: string) {
    await supabase.from('goals').delete().eq('id', id)
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  async function handleAddProgress(goalId: string) {
    const amount = parseFloat(progressAmount)
    if (!amount || amount <= 0) return
    const goal = goals.find(g => g.id === goalId)!
    const newAmount = Math.min(Number(goal.target_amount), Number(goal.current_amount) + amount)
    const isCompleted = newAmount >= Number(goal.target_amount)
    const { data } = await supabase.from('goals').update({ current_amount: newAmount, is_completed: isCompleted }).eq('id', goalId).select().single()
    if (data) setGoals(prev => prev.map(g => g.id === goalId ? data : g))
    setAddingProgress(null)
    setProgressAmount('')
  }

  const active = goals.filter(g => !g.is_completed)
  const completed = goals.filter(g => g.is_completed)

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-white">Metas financeiras</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Nova meta
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Target className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-lg mb-2">Nenhuma meta criada</p>
          <p className="text-sm">Defina objetivos financeiros e acompanhe seu progresso</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Em andamento</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {active.map(goal => {
                  const pct = Math.min(100, Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100))
                  const remaining = Number(goal.target_amount) - Number(goal.current_amount)
                  return (
                    <div key={goal.id} className="bg-[#0a1628]/80 border border-[#1a3a5c]/60 rounded-2xl p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <div className="w-3 h-3 rounded-full" style={{ background: goal.color }} />
                            <p className="font-semibold text-white">{goal.name}</p>
                          </div>
                          {goal.description && <p className="text-xs text-slate-500 ml-5">{goal.description}</p>}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(goal)} className="p-1.5 hover:bg-[#0d1f3c] rounded-lg transition">
                            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                          <button onClick={() => handleDelete(goal.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg transition">
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-white font-bold">{formatCurrency(Number(goal.current_amount))}</span>
                        <span className="text-slate-400">{formatCurrency(Number(goal.target_amount))}</span>
                      </div>
                      <div className="w-full bg-[#0d1f3c] rounded-full h-2 mb-2">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: goal.color }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">{pct}% · Faltam {formatCurrency(remaining)}</span>
                        {goal.deadline && (
                          <span className="text-xs text-slate-500">
                            até {new Date(goal.deadline + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>

                      {addingProgress === goal.id ? (
                        <div className="flex gap-2 mt-3">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={progressAmount}
                            onChange={e => setProgressAmount(e.target.value)}
                            placeholder="Valor a adicionar"
                            autoFocus
                            className="flex-1 px-3 py-1.5 bg-[#0d1f3c] border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button onClick={() => handleAddProgress(goal.id)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition">OK</button>
                          <button onClick={() => { setAddingProgress(null); setProgressAmount('') }} className="px-2 py-1.5 text-slate-400 hover:text-white">✕</button>
                        </div>
                      ) : (
                        <button onClick={() => setAddingProgress(goal.id)} className="mt-3 w-full py-1.5 border border-slate-600 hover:bg-[#0d1f3c]/50 text-slate-400 hover:text-white text-xs rounded-lg transition">
                          + Adicionar progresso
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Concluídas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {completed.map(goal => (
                  <div key={goal.id} className="bg-[#0a1628]/30 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{goal.name}</p>
                      <p className="text-xs text-green-400">{formatCurrency(Number(goal.target_amount))} atingido!</p>
                    </div>
                    <button onClick={() => handleDelete(goal.id)} className="text-slate-500 hover:text-red-400 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0a1628] border border-[#1a3a5c]/60 rounded-2xl w-full max-w-md flex flex-col" style={{ maxHeight: 'calc(100dvh - 120px)' }}>
            <div className="flex items-center justify-between p-5 border-b border-[#1a3a5c]/60">
              <h2 className="font-semibold text-white">{editingId ? 'Editar meta' : 'Nova meta'}</h2>
              <button onClick={closeModal}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome da meta</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Ex: Viagem para Europa" className="w-full px-3 py-2 bg-[#0d1f3c] border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Descrição (opcional)</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detalhes sobre a meta..." className="w-full px-3 py-2 bg-[#0d1f3c] border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Valor alvo (R$)</label>
                  <input type="number" step="0.01" min="1" value={form.target_amount} onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))} required placeholder="0,00" className="w-full px-3 py-2 bg-[#0d1f3c] border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Valor atual (R$)</label>
                  <input type="number" step="0.01" min="0" value={form.current_amount} onChange={e => setForm(f => ({ ...f, current_amount: e.target.value }))} className="w-full px-3 py-2 bg-[#0d1f3c] border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Prazo (opcional)</label>
                <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="w-full px-3 py-2 bg-[#0d1f3c] border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Cor</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-7 h-7 rounded-full transition ${form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 border border-slate-600 hover:bg-[#0d1f3c] text-slate-300 text-sm font-medium rounded-lg transition">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Salvar' : 'Criar meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

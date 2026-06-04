'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Transaction, Budget, Goal } from '@/types'
import { formatCurrency, getMonthName, getCategoryColor } from '@/lib/utils'
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, Wallet, Plus, ArrowRight } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  transactions: Transaction[]
  budgets: Budget[]
  goals: Goal[]
  month: number
  year: number
  userName: string
}

export default function DashboardClient({ transactions, budgets, goals, month, year, userName }: Props) {
  const stats = useMemo(() => {
    const income = transactions.filter(t => t.category === 'income').reduce((s, t) => s + Number(t.amount), 0)
    const fixed = transactions.filter(t => t.category === 'fixed_expense').reduce((s, t) => s + Number(t.amount), 0)
    const variable = transactions.filter(t => t.category === 'variable_expense').reduce((s, t) => s + Number(t.amount), 0)
    const investments = transactions.filter(t => t.category === 'investment').reduce((s, t) => s + Number(t.amount), 0)
    return { income, fixed, variable, investments, totalExpenses: fixed + variable, balance: income - fixed - variable - investments }
  }, [transactions])

  const pieData = useMemo(() => {
    const data = [
      { name: 'Gastos Fixos', value: stats.fixed, color: '#ef4444' },
      { name: 'Gastos Variáveis', value: stats.variable, color: '#f97316' },
      { name: 'Investimentos', value: stats.investments, color: '#6366f1' },
    ].filter(d => d.value > 0)
    return data
  }, [stats])

  const recentTransactions = transactions.slice(0, 5)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">{greeting}, {userName.split(' ')[0]}!</h1>
          <p className="text-slate-400 text-sm mt-0.5">{getMonthName(month)} de {year}</p>
        </div>
        <Link
          href="/dashboard/transactions?new=1"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Nova transação
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Entradas"
          value={stats.income}
          icon={<ArrowUpCircle className="w-5 h-5 text-green-400" />}
          color="green"
        />
        <SummaryCard
          label="Gastos"
          value={stats.totalExpenses}
          icon={<ArrowDownCircle className="w-5 h-5 text-red-400" />}
          color="red"
        />
        <SummaryCard
          label="Investimentos"
          value={stats.investments}
          icon={<TrendingUp className="w-5 h-5 text-blue-400" />}
          color="indigo"
        />
        <SummaryCard
          label="Saldo disponível"
          value={stats.balance}
          icon={<Wallet className="w-5 h-5 text-slate-400" />}
          color={stats.balance >= 0 ? 'green' : 'red'}
          highlight
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie chart */}
        <div className="lg:col-span-1 bg-[#0a1628]/80 border border-[#1a3a5c]/60 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">Distribuição</h2>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v: any) => typeof v === 'number' ? formatCurrency(v) : ''}
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-slate-400">{d.name}</span>
                    </div>
                    <span className="text-white font-medium">{formatCurrency(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm">
              <p>Nenhum dado ainda</p>
              <Link href="/dashboard/transactions?new=1" className="text-blue-400 mt-2 hover:underline">
                Adicionar transação
              </Link>
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="lg:col-span-2 bg-[#0a1628]/80 border border-[#1a3a5c]/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Últimas transações</h2>
            <Link href="/dashboard/transactions" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentTransactions.length > 0 ? (
            <div className="space-y-2">
              {recentTransactions.map(t => (
                <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-[#1a3a5c]/60/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: getCategoryColor(t.category) }} />
                    <div>
                      <p className="text-sm font-medium text-white">{t.description}</p>
                      <p className="text-xs text-slate-500">{new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')} · {t.subcategory || t.category}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${t.category === 'income' ? 'text-green-400' : t.category === 'investment' ? 'text-blue-400' : 'text-red-400'}`}>
                    {t.category === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-slate-500 text-sm">
              <p>Nenhuma transação este mês</p>
            </div>
          )}
        </div>
      </div>

      {/* Goals preview */}
      {goals.length > 0 && (
        <div className="bg-[#0a1628]/80 border border-[#1a3a5c]/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Metas em andamento</h2>
            <Link href="/dashboard/goals" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {goals.map(goal => {
              const pct = Math.min(100, Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100))
              return (
                <div key={goal.id} className="bg-[#0d1f3c]/30 rounded-xl p-4">
                  <p className="text-sm font-medium text-white mb-1">{goal.name}</p>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>{formatCurrency(Number(goal.current_amount))}</span>
                    <span>{formatCurrency(Number(goal.target_amount))}</span>
                  </div>
                  <div className="w-full bg-[#0d1f3c] rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%`, background: goal.color }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 text-right">{pct}%</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, icon, color, highlight }: {
  label: string
  value: number
  icon: React.ReactNode
  color: 'green' | 'red' | 'indigo'
  highlight?: boolean
}) {
  const colorMap = {
    green: 'text-green-400',
    red: 'text-red-400',
    indigo: 'text-blue-400',
  }
  return (
    <div className={`bg-[#0a1628]/80 border rounded-2xl p-4 ${highlight ? 'border-blue-500/30' : 'border-[#1a3a5c]/60'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-400 font-medium">{label}</span>
        {icon}
      </div>
      <p className={`text-xl font-bold ${colorMap[color]}`}>
        {formatCurrency(value)}
      </p>
    </div>
  )
}

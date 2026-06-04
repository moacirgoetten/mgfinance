'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Transaction } from '@/types'
import { formatCurrency, getMonthName } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, AreaChart, Area,
} from 'recharts'

const COLORS = {
  income: '#22c55e',
  fixed_expense: '#ef4444',
  variable_expense: '#f97316',
  investment: '#6366f1',
}

interface Props {
  transactions: Transaction[]
  month: number
  year: number
}

export default function ChartsClient({ transactions, month, year }: Props) {
  const router = useRouter()

  function navigateMonth(dir: number) {
    let m = month + dir, y = year
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    router.push(`/dashboard/charts?month=${m}&year=${y}`)
  }

  const pieData = useMemo(() => {
    const totals: Record<string, number> = {}
    transactions.forEach(t => {
      if (t.category === 'income') return
      totals[t.category] = (totals[t.category] || 0) + Number(t.amount)
    })
    return Object.entries(totals).map(([cat, val]) => ({
      name: cat === 'fixed_expense' ? 'Gastos Fixos' : cat === 'variable_expense' ? 'Gastos Variáveis' : 'Investimentos',
      value: val,
      color: COLORS[cat as keyof typeof COLORS],
    }))
  }, [transactions])

  const subcategoryData = useMemo(() => {
    const totals: Record<string, number> = {}
    transactions
      .filter(t => t.category !== 'income' && t.subcategory)
      .forEach(t => {
        const key = t.subcategory!
        totals[key] = (totals[key] || 0) + Number(t.amount)
      })
    return Object.entries(totals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }))
  }, [transactions])

  const dailyData = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate()
    const byDay: Record<number, { income: number; expense: number }> = {}
    for (let d = 1; d <= daysInMonth; d++) byDay[d] = { income: 0, expense: 0 }

    transactions.forEach(t => {
      const day = parseInt(t.date.split('-')[2])
      if (t.category === 'income') byDay[day].income += Number(t.amount)
      else byDay[day].expense += Number(t.amount)
    })

    return Object.entries(byDay).map(([day, vals]) => ({
      day: `${day}`,
      Entradas: vals.income,
      Gastos: vals.expense,
    }))
  }, [transactions, month, year])

  const cumulativeBalance = useMemo(() => {
    let balance = 0
    const byDay: Record<string, number> = {}
    transactions.forEach(t => {
      const day = t.date.split('-')[2]
      byDay[day] = (byDay[day] || 0) + (t.category === 'income' ? Number(t.amount) : -Number(t.amount))
    })
    const daysInMonth = new Date(year, month, 0).getDate()
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = String(i + 1).padStart(2, '0')
      balance += byDay[day] || 0
      return { day: `${i + 1}`, Saldo: balance }
    })
  }, [transactions, month, year])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fmtCurrency = (v: any) => typeof v === 'number' ? formatCurrency(v) : ''

  const tooltipStyle = {
    contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9', fontSize: '12px' },
    labelStyle: { color: '#94a3b8' },
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">Gráficos</h1>
        <div className="flex items-center gap-1 ml-2">
          <button onClick={() => navigateMonth(-1)} className="p-1.5 hover:bg-[#0d1f3c] rounded transition text-slate-400 hover:text-white">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-slate-300 text-sm font-medium px-1">{getMonthName(month)} {year}</span>
          <button onClick={() => navigateMonth(1)} className="p-1.5 hover:bg-[#0d1f3c] rounded transition text-slate-400 hover:text-white">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <p>Nenhuma transação em {getMonthName(month)} {year}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribuição de gastos - Pizza */}
          <div className="bg-[#0a1628]/80 border border-[#1a3a5c]/60 rounded-2xl p-5">
            <h2 className="font-semibold text-white mb-4">Distribuição de gastos</h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} paddingAngle={3} dataKey="value" label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={fmtCurrency} {...tooltipStyle} />
                  <Legend formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-slate-500 text-sm text-center py-10">Sem gastos registrados</p>}
          </div>

          {/* Top subcategorias - Barras horizontais */}
          <div className="bg-[#0a1628]/80 border border-[#1a3a5c]/60 rounded-2xl p-5">
            <h2 className="font-semibold text-white mb-4">Top categorias de gastos</h2>
            {subcategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={subcategoryData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={80} />
                  <Tooltip formatter={fmtCurrency} {...tooltipStyle} />
                  <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} name="Valor" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-slate-500 text-sm text-center py-10">Sem subcategorias registradas</p>}
          </div>

          {/* Entradas vs Gastos por dia - Barras */}
          <div className="bg-[#0a1628]/80 border border-[#1a3a5c]/60 rounded-2xl p-5 lg:col-span-2">
            <h2 className="font-semibold text-white mb-4">Entradas vs Gastos por dia</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={fmtCurrency} {...tooltipStyle} />
                <Legend formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{value}</span>} />
                <Bar dataKey="Entradas" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Gastos" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Saldo acumulado no mês */}
          <div className="bg-[#0a1628]/80 border border-[#1a3a5c]/60 rounded-2xl p-5 lg:col-span-2">
            <h2 className="font-semibold text-white mb-4">Evolução do saldo no mês</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={cumulativeBalance} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <defs>
                  <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => `R$${(v/1000).toFixed(1)}k`} />
                <Tooltip formatter={fmtCurrency} {...tooltipStyle} />
                <Area type="monotone" dataKey="Saldo" stroke="#2563eb" strokeWidth={2} fill="url(#balanceGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

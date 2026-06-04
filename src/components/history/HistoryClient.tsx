'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Transaction, MonthlySummary } from '@/types'
import { formatCurrency, getMonthName } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Brain, FileText, Loader2, Download } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

interface Props {
  transactions: Transaction[]
  summaries: MonthlySummary[]
  year: number
  userId: string
}

export default function HistoryClient({ transactions, summaries: initialSummaries, year, userId }: Props) {
  const router = useRouter()
  const [summaries, setSummaries] = useState<MonthlySummary[]>(initialSummaries)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [loadingMonth, setLoadingMonth] = useState<number | null>(null)
  const [generating, setGenerating] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)

  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1
      const monthTx = transactions.filter(t => parseInt(t.date.split('-')[1]) === m)
      const income = monthTx.filter(t => t.category === 'income').reduce((s, t) => s + Number(t.amount), 0)
      const expenses = monthTx.filter(t => t.category !== 'income' && t.category !== 'investment').reduce((s, t) => s + Number(t.amount), 0)
      const investments = monthTx.filter(t => t.category === 'investment').reduce((s, t) => s + Number(t.amount), 0)
      return { month: getMonthName(m).slice(0, 3), Entradas: income, Gastos: expenses, Investimentos: investments }
    })
  }, [transactions])

  const yearTotals = useMemo(() => {
    const income = transactions.filter(t => t.category === 'income').reduce((s, t) => s + Number(t.amount), 0)
    const expenses = transactions.filter(t => t.category !== 'income' && t.category !== 'investment').reduce((s, t) => s + Number(t.amount), 0)
    const investments = transactions.filter(t => t.category === 'investment').reduce((s, t) => s + Number(t.amount), 0)
    return { income, expenses, investments, balance: income - expenses - investments }
  }, [transactions])

  async function generateSummary(month: number) {
    setGenerating(true)
    setLoadingMonth(month)
    const res = await fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, year }),
    })
    const data = await res.json()
    if (data.summary) {
      setSummaries(prev => {
        const existing = prev.find(s => s.month === month)
        if (existing) return prev.map(s => s.month === month ? { ...s, summary_text: data.summary } : s)
        return [...prev, { id: Date.now().toString(), user_id: userId, month, year, summary_text: data.summary, generated_at: new Date().toISOString(), ...data.stats }]
      })
    }
    setGenerating(false)
    setLoadingMonth(null)
  }

  async function exportPdf(month: number) {
    setExportingPdf(true)
    const summary = summaries.find(s => s.month === month)
    if (!summary) { setExportingPdf(false); return }

    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF()

    doc.setFontSize(20)
    doc.setTextColor(99, 102, 241)
    doc.text('MGFinance', 20, 20)

    doc.setFontSize(14)
    doc.setTextColor(30, 41, 59)
    doc.text(`Relatório Financeiro - ${getMonthName(month)} ${year}`, 20, 35)

    doc.setFontSize(10)
    doc.setTextColor(71, 85, 105)
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 45)

    doc.setLineWidth(0.5)
    doc.setDrawColor(226, 232, 240)
    doc.line(20, 50, 190, 50)

    const stats = [
      `Entradas: ${formatCurrency(Number(summary.total_income) || 0)}`,
      `Gastos: ${formatCurrency(Number(summary.total_expenses) || 0)}`,
      `Investimentos: ${formatCurrency(Number(summary.total_investments) || 0)}`,
      `Saldo: ${formatCurrency(Number(summary.net_balance) || 0)}`,
    ]
    doc.setFontSize(11)
    doc.setTextColor(30, 41, 59)
    stats.forEach((s, i) => doc.text(s, 20, 60 + i * 8))

    doc.line(20, 95, 190, 95)

    const lines = doc.splitTextToSize(summary.summary_text, 170)
    doc.setFontSize(10)
    doc.setTextColor(51, 65, 85)
    doc.text(lines, 20, 105)

    doc.save(`MGFinance-${getMonthName(month).toLowerCase()}-${year}.pdf`)
    setExportingPdf(false)
  }

  const tooltipStyle = {
    contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9', fontSize: '12px' },
  }

  const selectedSummary = selectedMonth ? summaries.find(s => s.month === selectedMonth) : null

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-white">Histórico anual</h1>
        <div className="flex items-center gap-1">
          <button onClick={() => router.push(`/dashboard/history?year=${year - 1}`)} className="p-1.5 hover:bg-[#0d1f3c] rounded transition text-slate-400 hover:text-white">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-slate-300 font-semibold px-1">{year}</span>
          <button onClick={() => router.push(`/dashboard/history?year=${year + 1}`)} className="p-1.5 hover:bg-[#0d1f3c] rounded transition text-slate-400 hover:text-white">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Year totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total entradas', value: yearTotals.income, color: 'text-green-400' },
          { label: 'Total gastos', value: yearTotals.expenses, color: 'text-red-400' },
          { label: 'Total investido', value: yearTotals.investments, color: 'text-blue-400' },
          { label: 'Saldo do ano', value: yearTotals.balance, color: yearTotals.balance >= 0 ? 'text-green-400' : 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#0a1628]/80 border border-[#1a3a5c]/60 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>{formatCurrency(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Annual bar chart */}
      <div className="bg-[#0a1628]/80 border border-[#1a3a5c]/60 rounded-2xl p-5 mb-6">
        <h2 className="font-semibold text-white mb-4">Visão anual mês a mês</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tooltip formatter={(v: any) => typeof v === 'number' ? formatCurrency(v) : ''} {...tooltipStyle} />
            <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{v}</span>} />
            <Bar dataKey="Entradas" fill="#22c55e" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Gastos" fill="#ef4444" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Investimentos" fill="#2563eb" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly summaries grid */}
      <div>
        <h2 className="font-semibold text-white mb-4">Resumos mensais com IA</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
          {Array.from({ length: 12 }, (_, i) => {
            const m = i + 1
            const hasTx = transactions.some(t => parseInt(t.date.split('-')[1]) === m)
            const hasSummary = summaries.some(s => s.month === m)
            const isSelected = selectedMonth === m
            return (
              <button
                key={m}
                onClick={() => setSelectedMonth(isSelected ? null : m)}
                disabled={!hasTx}
                className={`p-3 rounded-xl border text-sm font-medium transition ${
                  isSelected ? 'bg-blue-600 border-blue-500 text-white' :
                  hasSummary ? 'bg-[#0d1f3c]/50 border-green-500/30 text-green-400 hover:bg-[#0d1f3c]' :
                  hasTx ? 'bg-[#0a1628]/80 border-[#1a3a5c]/60 text-slate-300 hover:bg-[#0d1f3c]' :
                  'bg-[#0a1628]/20 border-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                <div>{getMonthName(m).slice(0, 3)}</div>
                {hasSummary && <div className="text-[10px] mt-0.5 opacity-70">✓ IA</div>}
              </button>
            )
          })}
        </div>

        {selectedMonth && (
          <div className="bg-[#0a1628]/80 border border-[#1a3a5c]/60 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">{getMonthName(selectedMonth)} {year}</h3>
              <div className="flex gap-2">
                {selectedSummary && (
                  <button
                    onClick={() => exportPdf(selectedMonth)}
                    disabled={exportingPdf}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0d1f3c] hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition"
                  >
                    {exportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    Exportar PDF
                  </button>
                )}
                <button
                  onClick={() => generateSummary(selectedMonth)}
                  disabled={generating}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition"
                >
                  {generating && loadingMonth === selectedMonth
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando...</>
                    : <><Brain className="w-3.5 h-3.5" /> {selectedSummary ? 'Regenerar resumo' : 'Gerar resumo com IA'}</>
                  }
                </button>
              </div>
            </div>

            {selectedSummary ? (
              <div className="prose prose-sm prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-slate-300 leading-relaxed">
                  {selectedSummary.summary_text}
                </pre>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <Brain className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm mb-1">Nenhum resumo gerado ainda</p>
                <p className="text-xs">Clique em "Gerar resumo com IA" para analisar este mês</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

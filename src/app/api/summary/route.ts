import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { month, year } = await request.json()

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (!transactions || transactions.length === 0) {
    return NextResponse.json({ error: 'Nenhuma transação encontrada para este mês.' }, { status: 400 })
  }

  const income = transactions.filter(t => t.category === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const fixed = transactions.filter(t => t.category === 'fixed_expense').reduce((s, t) => s + Number(t.amount), 0)
  const variable = transactions.filter(t => t.category === 'variable_expense').reduce((s, t) => s + Number(t.amount), 0)
  const investments = transactions.filter(t => t.category === 'investment').reduce((s, t) => s + Number(t.amount), 0)
  const balance = income - fixed - variable - investments

  const subcategoryTotals: Record<string, number> = {}
  transactions.filter(t => t.category !== 'income' && t.subcategory).forEach(t => {
    subcategoryTotals[t.subcategory!] = (subcategoryTotals[t.subcategory!] || 0) + Number(t.amount)
  })

  const topExpenses = Object.entries(subcategoryTotals).sort(([, a], [, b]) => b - a).slice(0, 5)
  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

  const prompt = `Você é um consultor financeiro pessoal brasileiro, experiente, direto e empático. Analise os dados financeiros do usuário referente ao mês de ${monthNames[month - 1]} de ${year} e gere um resumo mensal completo em português.

DADOS FINANCEIROS:
- Entradas totais: R$ ${income.toFixed(2)}
- Gastos fixos: R$ ${fixed.toFixed(2)}
- Gastos variáveis: R$ ${variable.toFixed(2)}
- Investimentos: R$ ${investments.toFixed(2)}
- Saldo final: R$ ${balance.toFixed(2)} (${balance >= 0 ? 'positivo' : 'negativo'})
- Taxa de poupança: ${income > 0 ? ((investments / income) * 100).toFixed(1) : 0}%
- Gastos como % da renda: ${income > 0 ? (((fixed + variable) / income) * 100).toFixed(1) : 0}%

MAIORES GASTOS POR CATEGORIA:
${topExpenses.map(([cat, val]) => `- ${cat}: R$ ${val.toFixed(2)}`).join('\n')}

TODAS AS TRANSAÇÕES (${transactions.length} no total):
${transactions.map(t => `[${t.date}] ${t.category === 'income' ? '+' : '-'} R$${Number(t.amount).toFixed(2)} - ${t.description}${t.subcategory ? ` (${t.subcategory})` : ''}`).join('\n')}

Por favor, escreva um resumo financeiro mensal com:
1. **Visão geral do mês** - como foi o mês financeiramente, em 2-3 frases
2. **Pontos positivos** - o que o usuário fez bem (máx 3 itens)
3. **Pontos de atenção** - onde pode melhorar (máx 3 itens)
4. **Maiores gastos** - análise dos maiores gastos e se são razoáveis
5. **Investimentos** - avalie o nível de investimento em relação à renda
6. **Dica do mês** - 1 dica prática e específica baseada nos dados
7. **Nota financeira** - uma nota de 0 a 10 com justificativa curta

Use linguagem amigável, direta e motivacional. Seja específico com os números. Não use markdown complexo, apenas títulos em negrito e bullet points simples.`

  try {
    const result = await genAI.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    })
    const summaryText = result.text ?? ''

    await supabase.from('monthly_summaries').upsert({
      user_id: user.id, month, year, summary_text: summaryText,
      total_income: income, total_expenses: fixed + variable,
      total_investments: investments, net_balance: balance,
    }, { onConflict: 'user_id,month,year' })

    return NextResponse.json({ summary: summaryText, stats: { income, fixed, variable, investments, balance } })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Gemini error:', msg)
    return NextResponse.json({ error: `Erro ao gerar resumo: ${msg}` }, { status: 500 })
  }
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BudgetsClient from '@/components/budgets/BudgetsClient'

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const params = await searchParams
  const now = new Date()
  const month = parseInt(params.month || String(now.getMonth() + 1))
  const year = parseInt(params.year || String(now.getFullYear()))

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  const [{ data: transactions }, { data: budgets }] = await Promise.all([
    supabase.from('transactions').select('*').eq('user_id', user.id).gte('date', startDate).lte('date', endDate),
    supabase.from('budgets').select('*').eq('user_id', user.id).eq('month', month).eq('year', year),
  ])

  return (
    <BudgetsClient
      transactions={transactions || []}
      budgets={budgets || []}
      month={month}
      year={year}
      userId={user.id}
    />
  )
}

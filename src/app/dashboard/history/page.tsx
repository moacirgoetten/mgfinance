import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HistoryClient from '@/components/history/HistoryClient'

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const params = await searchParams
  const year = parseInt(params.year || String(new Date().getFullYear()))

  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`

  const [{ data: transactions }, { data: summaries }] = await Promise.all([
    supabase.from('transactions').select('*').eq('user_id', user.id).gte('date', startDate).lte('date', endDate),
    supabase.from('monthly_summaries').select('*').eq('user_id', user.id).eq('year', year).order('month'),
  ])

  return <HistoryClient transactions={transactions || []} summaries={summaries || []} year={year} userId={user.id} />
}

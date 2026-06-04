import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChartsClient from '@/components/charts/ChartsClient'

export default async function ChartsPage({
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

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  return <ChartsClient transactions={transactions || []} month={month} year={year} />
}

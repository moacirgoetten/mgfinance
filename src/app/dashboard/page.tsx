import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  const [{ data: transactions }, { data: budgets }, { data: goals }] = await Promise.all([
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false }),
    supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month)
      .eq('year', year),
    supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_completed', false)
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  return (
    <DashboardClient
      transactions={transactions || []}
      budgets={budgets || []}
      goals={goals || []}
      month={month}
      year={year}
      userName={user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário'}
    />
  )
}

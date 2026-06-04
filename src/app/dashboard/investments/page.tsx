import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InvestmentsClient from '@/components/investments/InvestmentsClient'

export default async function InvestmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: assets } = await supabase
    .from('investment_assets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <InvestmentsClient assets={assets || []} userId={user.id} />
}

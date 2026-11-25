import { redirect } from 'next/navigation'

import { MetricsDashboard } from '@/components/metrics-dashboard'
import { normalizeGenerationMetrics } from '@/utils/generation-metrics'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'My Generation Metrics' }

// Private: the signed-in user's own metrics, from public.get_my_generation_metrics() (migration
// 034). The function uses auth.uid() from this user's JWT and takes no arguments, so it cannot be
// asked about anyone else. No privileged key is involved, so this also works on Vercel.
export default async function MetricsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous || user.app_metadata?.provider === 'anonymous') {
    return redirect('/login')
  }

  const { data, error } = await supabase.rpc('get_my_generation_metrics')
  if (error) {
    // Log the code only; PGRST202 means migration 034 has not been applied.
    console.error('Error loading generation metrics:', error.code)
    return (
      <MetricsDashboard
        metrics={null}
        error={error.code === 'PGRST202'
          ? 'Metrics are not set up yet. Apply database migration 034, then reload this page.'
          : 'We couldn’t load your metrics right now. Please try again.'}
      />
    )
  }

  const row = Array.isArray(data) ? data[0] : data
  return <MetricsDashboard metrics={normalizeGenerationMetrics(row)} />
}

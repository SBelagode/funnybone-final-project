import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  formatPercent,
  formatUtcDay,
  type GenerationMetrics,
} from '@/utils/generation-metrics'

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

function KpiCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardDescription className="text-sm font-medium">{label}</CardDescription>
        <CardTitle className="text-3xl sm:text-4xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs sm:text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

function GenerationsChart({ daily }: { daily: GenerationMetrics['daily'] }) {
  const max = Math.max(1, ...daily.map(entry => entry.jobs))
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Generations Over Time</CardTitle>
        <CardDescription>Jobs with captions per day, last 7 days (UTC).</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="flex items-end justify-between text-xs text-muted-foreground mb-1">
            <span className="tabular-nums">{max}</span>
          </div>
          {/* Recessive top gridline at the maximum; bars rise from the baseline. */}
          <div
            className="relative flex h-48 items-end gap-0.5 sm:gap-2 border-b border-border
                       border-t border-t-border/40"
          >
            {daily.map(entry => {
              const { full } = formatUtcDay(entry.day)
              const height = (entry.jobs / max) * 100
              const label = `${plural(entry.jobs, 'job')} on ${full}`
              return (
                <div
                  key={entry.day}
                  data-day={entry.day}
                  role="img"
                  aria-label={label}
                  tabIndex={0}
                  className="group relative flex h-full flex-1 items-end justify-center rounded
                             outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {entry.jobs > 0 && (
                    <div
                      data-bar
                      className="w-full max-w-10 rounded-t bg-primary"
                      style={{ height: `${height}%` }}
                    />
                  )}
                  <span
                    className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1
                               -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover
                               px-2 py-1 text-xs text-popover-foreground shadow-sm opacity-0
                               transition-opacity group-hover:opacity-100
                               group-focus-visible:opacity-100"
                    aria-hidden="true"
                  >
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="mt-2 flex gap-0.5 sm:gap-2">
            {daily.map(entry => {
              const { weekday, date } = formatUtcDay(entry.day)
              return (
                <div key={entry.day} className="flex-1 text-center text-[10px] sm:text-xs
                  text-muted-foreground leading-tight">
                  <div>{weekday}</div>
                  <div>{date}</div>
                </div>
              )
            })}
          </div>
        </div>
        <table className="sr-only">
          <caption>Jobs with captions per day, last 7 days (UTC)</caption>
          <thead>
            <tr><th scope="col">Day (UTC)</th><th scope="col">Jobs with captions</th></tr>
          </thead>
          <tbody>
            {daily.map(entry => (
              <tr key={entry.day}>
                <td>{formatUtcDay(entry.day).full}</td>
                <td>{entry.jobs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

export function MetricsDashboard({
  metrics,
  error,
}: {
  metrics: GenerationMetrics | null
  error?: string
}) {
  const empty = !error && metrics !== null && metrics.jobsWithCaptions === 0
  return (
    <main className="w-full max-w-4xl mx-auto px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold">My Generation Metrics</h1>
        <p className="text-sm text-muted-foreground">
          Your own caption generations. Days are shown in UTC.
        </p>
      </header>

      {error && (
        <Card>
          <CardContent className="pt-6">
            <p role="alert" className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {empty && (
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <p className="font-medium">No generations yet</p>
            <p className="text-sm text-muted-foreground">
              Once you generate captions for an image, your metrics will appear here.
            </p>
            <Link href="/new" className="inline-block text-primary underline">
              Generate captions
            </Link>
          </CardContent>
        </Card>
      )}

      {!error && metrics && !empty && (
        <>
          <section aria-label="Key metrics" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              label="Jobs with captions"
              value={String(metrics.jobsWithCaptions)}
              detail={'Generations that finished and produced captions, including partly '
                + 'successful ones.'}
            />
            <KpiCard
              label="Nudge usage"
              value={formatPercent(metrics.nudgeUsagePercent)}
              detail={`${metrics.nudgedJobs} of ${plural(metrics.jobsWithCaptions, 'job')} `
                + 'ran with a nonempty nudge.'}
            />
            <KpiCard
              label="Images regenerated"
              value={formatPercent(metrics.imagesRegeneratedPercent)}
              detail={`${metrics.imagesRegenerated} of ${plural(metrics.imagesGenerated, 'image')} `
                + 'were generated two or more times.'}
            />
          </section>
          <GenerationsChart daily={metrics.daily} />
        </>
      )}
    </main>
  )
}

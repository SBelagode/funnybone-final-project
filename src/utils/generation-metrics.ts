// Shapes the result of public.get_my_generation_metrics() (migration 034) for the /metrics page.
// The database decides which jobs count and which seven UTC days are shown; this only checks
// the values and fills any missing day with zero, so the chart always has seven bars.
export type DailyCount = { day: string; jobs: number }

export type GenerationMetrics = {
  jobsWithCaptions: number
  nudgedJobs: number
  nudgeUsagePercent: number | null
  imagesGenerated: number
  imagesRegenerated: number
  imagesRegeneratedPercent: number | null
  daily: DailyCount[]
}

const DAY = /^\d{4}-\d{2}-\d{2}$/
const DAY_MS = 24 * 60 * 60 * 1000

const count = (value: unknown) => {
  const number = Number(value)
  return Number.isInteger(number) && number >= 0 ? number : 0
}

const percent = (value: unknown, whole: number) => {
  if (whole === 0 || value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 && number <= 100 ? number : null
}

// The last seven calendar days in UTC, oldest first, ending with today (UTC).
export function lastSevenUtcDays(now = new Date()): string[] {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return Array.from({ length: 7 }, (_, index) =>
    new Date(today - (6 - index) * DAY_MS).toISOString().slice(0, 10))
}

export function normalizeGenerationMetrics(row: unknown, now = new Date()): GenerationMetrics {
  const source = (row ?? {}) as Record<string, unknown>
  const jobsWithCaptions = count(source.jobs_with_captions)
  const imagesGenerated = count(source.images_generated)

  const reported = new Map<string, number>()
  for (const entry of Array.isArray(source.daily_jobs) ? source.daily_jobs : []) {
    const { day, jobs } = (entry ?? {}) as { day?: unknown; jobs?: unknown }
    if (typeof day === 'string' && DAY.test(day)) reported.set(day, count(jobs))
  }
  // The database's own seven days are used when it sent them, so its clock is the one that counts.
  const days = reported.size === 7 ? [...reported.keys()].sort() : lastSevenUtcDays(now)

  return {
    jobsWithCaptions,
    nudgedJobs: Math.min(count(source.nudged_jobs), jobsWithCaptions),
    nudgeUsagePercent: percent(source.nudge_usage_percent, jobsWithCaptions),
    imagesGenerated,
    imagesRegenerated: Math.min(count(source.images_regenerated), imagesGenerated),
    imagesRegeneratedPercent: percent(source.images_regenerated_percent, imagesGenerated),
    daily: days.map(day => ({ day, jobs: reported.get(day) ?? 0 })),
  }
}

// Labels for a UTC calendar day, independent of the viewer's timezone.
export function formatUtcDay(day: string) {
  const date = new Date(`${day}T00:00:00Z`)
  const format = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...options }).format(date)
  return {
    weekday: format({ weekday: 'short' }),
    date: format({ month: 'short', day: 'numeric' }),
    full: format({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
  }
}

export const formatPercent = (value: number | null) =>
  value === null ? '—' : `${Number.isInteger(value) ? value : value.toFixed(1)}%`

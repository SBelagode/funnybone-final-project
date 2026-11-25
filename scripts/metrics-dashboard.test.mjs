// Mock tests for the /metrics page (Iteration 3). The real page, dashboard and normalizer, with
// Supabase stubbed. The database side of the metrics is tested by nonchalant-local's
// database/rls-verification/verify-034.sh against a real Postgres.
import { afterEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { loadModule, mount, textOf, walk } from './support/render-component.mjs'

const metricsModule = loadModule('utils/generation-metrics.ts')
const { normalizeGenerationMetrics, lastSevenUtcDays, formatUtcDay, formatPercent } = metricsModule
const component = name => Object.defineProperty(props => props.children ?? null, 'name',
  { value: name })
const ui = {
  Card: component('Card'), CardHeader: component('CardHeader'), CardTitle: component('CardTitle'),
  CardDescription: component('CardDescription'), CardContent: component('CardContent'),
}
const Link = component('Link')
const { MetricsDashboard } = loadModule('components/metrics-dashboard.tsx', {
  '@/components/ui/card': ui,
  'next/link': { __esModule: true, default: Link },
  '@/utils/generation-metrics': metricsModule,
})

const days = ['2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23',
  '2026-11-24', '2026-11-25']
const row = (overrides = {}) => ({
  jobs_with_captions: 4, nudged_jobs: 1, nudge_usage_percent: '25.0', images_generated: 3,
  images_regenerated: 1, images_regenerated_percent: '33.3',
  daily_jobs: days.map((day, index) => ({ day, jobs: [1, 0, 0, 0, 0, 1, 2][index] })),
  ...overrides,
})

// The dashboard renders as a tree; function components are expanded so text can be read.
function render(props) {
  const expand = node => {
    if (Array.isArray(node)) return node.map(expand)
    if (!node || typeof node !== 'object' || !node.props) return node
    if (typeof node.type === 'function' && Object.values(ui).includes(node.type) === false
      && node.type !== Link) {
      return expand(node.type(node.props))
    }
    return { ...node, props: { ...node.props, children: expand(node.props.children) } }
  }
  const tree = expand(MetricsDashboard(props))
  const nodes = walk(tree)
  return {
    nodes,
    text: textOf(tree).replace(/\s+/g, ' '),
    bars: () => nodes.filter(n => n.props['data-day']),
    find: match => nodes.find(match),
  }
}

// --- Normalizing the database result -----------------------------------------------------------

test('[mock] the database row becomes typed metrics with seven days', () => {
  const metrics = normalizeGenerationMetrics(row())
  assert.equal(metrics.jobsWithCaptions, 4)
  assert.equal(metrics.nudgeUsagePercent, 25)
  assert.equal(metrics.imagesRegeneratedPercent, 33.3)
  assert.deepEqual(metrics.daily.map(d => d.day), days)
  assert.deepEqual(metrics.daily.map(d => d.jobs), [1, 0, 0, 0, 0, 1, 2])
})

test('[mock] missing days are filled with zero, in UTC, ending today', () => {
  const now = new Date('2026-11-25T23:30:00Z')
  const metrics = normalizeGenerationMetrics(row({ daily_jobs: [{ day: '2026-11-24', jobs: 3 }] }),
    now)
  assert.deepEqual(metrics.daily.map(d => d.day), days)
  assert.deepEqual(metrics.daily.map(d => d.jobs), [0, 0, 0, 0, 0, 3, 0])
})

test('[mock] UTC day boundaries do not depend on the local timezone', () => {
  assert.equal(lastSevenUtcDays(new Date('2026-11-25T23:59:59.999Z')).at(-1), '2026-11-25')
  assert.equal(lastSevenUtcDays(new Date('2026-11-26T00:00:00Z')).at(-1), '2026-11-26')
  // 10:00 on Nov 26 in UTC+14 is still Nov 25 in UTC.
  assert.equal(lastSevenUtcDays(new Date('2026-11-26T10:00:00+14:00')).at(-1), '2026-11-25')
  assert.deepEqual(formatUtcDay('2026-11-24'),
    { weekday: 'Tue', date: 'Nov 24', full: 'Tuesday, November 24, 2026' })
})

test('[mock] malformed or missing values never become wrong numbers', () => {
  const metrics = normalizeGenerationMetrics({
    jobs_with_captions: -2, nudged_jobs: 'x', nudge_usage_percent: 140, images_generated: 2.5,
    images_regenerated: 9, images_regenerated_percent: null,
    daily_jobs: [{ day: 'not-a-day', jobs: 4 }, { day: '2026-11-25', jobs: -1 }, null],
  }, new Date('2026-11-25T12:00:00Z'))
  assert.equal(metrics.jobsWithCaptions, 0)
  assert.equal(metrics.nudgeUsagePercent, null)
  assert.equal(metrics.imagesGenerated, 0)
  assert.equal(metrics.imagesRegenerated, 0, 'never more regenerated images than images')
  assert.equal(metrics.daily.length, 7)
  assert.equal(metrics.daily.every(d => d.jobs === 0), true)
  assert.equal(normalizeGenerationMetrics(null).daily.length, 7)
  assert.equal(formatPercent(null), '—')
  assert.equal(formatPercent(25), '25%')
  assert.equal(formatPercent(33.3), '33.3%')
})

// --- The dashboard -------------------------------------------------------------------------

test('[mock] three KPI cards with values and explanations, in a responsive grid', () => {
  const view = render({ metrics: normalizeGenerationMetrics(row()) })
  assert.match(view.text, /My Generation Metrics/)
  const grid = view.find(n => n.props['aria-label'] === 'Key metrics')
  assert.match(grid.props.className, /grid-cols-1 sm:grid-cols-3/)
  assert.equal(grid.props.children.length, 3)
  assert.match(view.text, /Jobs with captions4Generations that finished and produced captions/)
  assert.match(view.text, /Nudge usage25%1 of 4 jobs ran with a nonempty nudge\./)
  assert.match(view.text, /Images regenerated33\.3%1 of 3 images were generated two or more/)
})

test('[mock] the chart has seven labelled days, zero days included, scaled to the maximum',
  () => {
    const view = render({ metrics: normalizeGenerationMetrics(row()) })
    assert.match(view.text, /Generations Over Time/)
    const bars = view.bars()
    assert.deepEqual(bars.map(b => b.props['data-day']), days)
    assert.deepEqual(bars.map(b => b.props['aria-label']), [
      '1 job on Thursday, November 19, 2026', '0 jobs on Friday, November 20, 2026',
      '0 jobs on Saturday, November 21, 2026', '0 jobs on Sunday, November 22, 2026',
      '0 jobs on Monday, November 23, 2026', '1 job on Tuesday, November 24, 2026',
      '2 jobs on Wednesday, November 25, 2026'])
    const heights = bars.map(b =>
      walk(b).find(n => n.props['data-bar'])?.props.style.height ?? null)
    assert.deepEqual(heights, ['50%', null, null, null, null, '50%', '100%'])
    assert.equal(bars.every(b => b.props.tabIndex === 0), true, 'each day can be focused')
    assert.match(view.text, /ThuNov 19.*WedNov 25/)
  })

test('[mock] the chart also has an accessible table of the same seven days', () => {
  const view = render({ metrics: normalizeGenerationMetrics(row()) })
  const table = view.find(n => n.type === 'table')
  assert.match(table.props.className, /sr-only/)
  const rows = walk(table).filter(n => n.type === 'tr').slice(1)
  assert.deepEqual(rows.map(r => textOf(r)), ['Thursday, November 19, 20261',
    'Friday, November 20, 20260', 'Saturday, November 21, 20260', 'Sunday, November 22, 20260',
    'Monday, November 23, 20260', 'Tuesday, November 24, 20261', 'Wednesday, November 25, 20262'])
})

test('[mock] a user with no generations sees a friendly empty state', () => {
  const view = render({ metrics: normalizeGenerationMetrics(row({
    jobs_with_captions: 0, nudged_jobs: 0, nudge_usage_percent: null, images_generated: 0,
    images_regenerated: 0, images_regenerated_percent: null,
    daily_jobs: days.map(day => ({ day, jobs: 0 })) })) })
  assert.match(view.text, /No generations yet/)
  assert.equal(view.find(n => n.type === Link).props.href, '/new')
  assert.equal(view.bars().length, 0)
  assert.equal(view.find(n => n.props['aria-label'] === 'Key metrics'), undefined)
})

test('[mock] an error is shown instead of metrics', () => {
  const view = render({ metrics: null, error: 'We couldn’t load your metrics right now.' })
  assert.equal(view.find(n => n.props.role === 'alert').props.children,
    'We couldn’t load your metrics right now.')
  assert.equal(view.bars().length, 0)
})

// --- The page --------------------------------------------------------------------------------

function page({ user = { id: 'user-1' }, rpc = { data: [row()], error: null } } = {}) {
  const calls = []
  const client = {
    auth: { getUser: async () => ({ data: { user } }) },
    rpc: async (...args) => { calls.push(args); return rpc },
  }
  const pageModule = loadModule('app/metrics/page.tsx', {
    'next/navigation': { redirect: path => { throw new Error(`REDIRECT:${path}`) } },
    '@/utils/supabase/server': { createClient: async () => client },
    '@/components/metrics-dashboard': { MetricsDashboard: component('MetricsDashboard') },
    '@/utils/generation-metrics': metricsModule,
  })
  return { render: () => pageModule.default(), calls, module: pageModule }
}

test('[mock] signed-out and anonymous visitors are sent to log in without querying', async () => {
  for (const user of [null, { id: 'u', is_anonymous: true },
    { id: 'u', app_metadata: { provider: 'anonymous' } }]) {
    const view = page({ user })
    await assert.rejects(view.render(), /REDIRECT:\/login/)
    assert.deepEqual(view.calls, [])
  }
})

test('[mock] the page asks only for the caller’s own metrics, with no arguments', async () => {
  const view = page()
  const element = await view.render()
  assert.deepEqual(view.calls, [['get_my_generation_metrics']])
  assert.equal(element.props.metrics.jobsWithCaptions, 4)
  assert.equal(element.props.error, undefined)
  assert.equal(view.module.metadata.title, 'My Generation Metrics')
})

test('[mock] a missing migration and other errors show a message, never raw details',
  async () => {
    const missing = await page({ rpc: { data: null,
      error: { code: 'PGRST202', message: 'Could not find the function' } } }).render()
    assert.match(missing.props.error, /migration 034/)
    const other = await page({ rpc: { data: null,
      error: { code: '42501', message: 'permission denied for function' } } }).render()
    assert.equal(other.props.error, 'We couldn’t load your metrics right now. Please try again.')
    assert.equal(other.props.metrics, null)
  })

// --- Navigation ------------------------------------------------------------------------------

let mounted
afterEach(() => { mounted?.unmount(); mounted = undefined })

test('[mock] signed-in users get a Metrics link on desktop and mobile', async t => {
  const mocks = react => ({
    'next/link': { __esModule: true, default: Link },
    'next/navigation': { usePathname: () => '/metrics' },
    '@/lib/utils': { cn: (...names) => names.filter(Boolean).join(' ') },
    'lucide-react': new Proxy({}, { get: (_, name) => component(String(name)) }),
    'framer-motion': { motion: new Proxy({}, { get: (_, name) => String(name) }),
      AnimatePresence: component('AnimatePresence') },
    './user-header-menu': { UserHeaderMenu: component('UserHeaderMenu') },
    react,
  })
  // The mobile menu locks page scrolling while open; Node has no DOM, so give it a body.
  const hadDocument = 'document' in globalThis
  globalThis.document ??= { body: { style: {} } }
  t.after(() => { if (!hadDocument) delete globalThis.document })
  for (const path of ['components/navigation-menu.tsx', 'components/mobile-slide-menu.tsx']) {
    mounted = mount(path, 'default', { email: 'me@example.test', firstName: 'Me', lastName: null },
      mocks)
    await mounted.settle()
    const menu = path.includes('mobile') ? mounted.find(n => n.props['aria-label'] === 'Open menu')
      : null
    if (menu) {
      menu.props.onClick()
      await mounted.settle()
    }
    const link = mounted.find(n => n.type === Link && n.props.href === '/metrics')
    assert.match(textOf(link), /Metrics/, path)
    mounted.unmount()
    mounted = undefined
  }
})

// Mock tests: the real image captions page and the real availability rules, with the caption API,
// server actions and storage stubbed. No request leaves this process. These cover the behavior
// needed once captions RLS (migration 032) leaves many shared images with fewer saved captions.
import { afterEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { loadModule, mount, textOf } from './support/render-component.mjs'
import * as jobClient from '../src/utils/caption-job-client.ts'

const { CaptionJobRequestError } = jobClient
const availabilityModule = loadModule('utils/caption-generation-availability.ts',
  { '@/utils/caption-job-client': jobClient })
const { createCaptionGenerationAvailability, BACKEND_RETRY_AFTER_MS } = availabilityModule
const component = name => Object.defineProperty(() => null, 'name', { value: name })
const caption = (imageId, n) => ({ id: randomUUID(), image_id: imageId, content: `Saved ${n}`,
  is_public: true, profile_id: 'someone', humor_flavor_id: null })
const saved = (imageId, count) => Array.from({ length: count }, (_, n) => caption(imageId, n + 1))

function memoryStore() {
  const map = new Map()
  return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), map }
}

// One browser session: the same availability state is shared by every page rendered with it.
function session({ apiUrl = 'http://127.0.0.1:4020' } = {}) {
  const clock = { now: 1_000_000 }
  const availability = createCaptionGenerationAvailability({
    apiUrl, storage: memoryStore(), now: () => clock.now,
  })
  return { clock, availability }
}

let mounted
afterEach(() => { mounted?.unmount(); mounted = undefined })

async function renderPage({ session: s = session(), isCommonUse = true, popular = 0,
  generate, initialCaptions, imageId = randomUUID() } = {}) {
  const calls = { fetch: 0, generate: 0, begin: 0 }
  const toasts = []
  const ui = {
    CaptionViewV2: component('CaptionViewV2'),
    LoadingScreen: component('LoadingScreen'),
  }
  const popularRows = saved(imageId, popular)
  let active = null
  // Stable, like the real hook's module-level toast function.
  const toast = value => toasts.push(value)
  mounted = mount('app/image/[imageId]/captions/image-captions-page-client.tsx',
    'ImageCaptionsPageClient',
    { imageId, imageUrl: 'https://example.test/i.png', isCommonUse, initialCaptions },
    react => ({
      'next/navigation': { useRouter: () => ({ push() {} }) },
      '@/hooks/use-toast': { useToast: () => ({ toast }) },
      '@/components/LoadingScreen': { __esModule: true, default: ui.LoadingScreen },
      '@/components/ui/caption-view-v2': { CaptionViewV2: ui.CaptionViewV2 },
      '@/utils/toggle-caption-save': { toggleCaptionSave() {} },
      '@/utils/saved-caption-ids': { loadSavedCaptionIds: async () => [] },
      '@/app/actions/auth/check-auth-status': {
        checkAuthStatusAction: async () => ({ userId: 'me' }),
      },
      '@/utils/site-url': { buildCaptionShareUrl: id => `https://example.test/c/${id}` },
      '@/app/actions/captions': {
        fetchPopularCaptionsByImageIdAction: async () => { calls.fetch += 1; return popularRows },
        generateCaptions: async (id, options) => {
          calls.generate += 1
          if (!generate) throw new Error('unexpected generation request')
          return generate(id, options, calls.generate)
        },
      },
      '@/utils/caption-generation-availability': {
        ...availabilityModule, captionGenerationAvailability: s.availability,
      },
      '@/hooks/useCaptionGeneration': {
        useCaptionGeneration() {
          const [isLoading, setIsLoading] = react.useState(false)
          const begin = react.useCallback(() => {
            calls.begin += 1
            const operation = {
              signal: new AbortController().signal,
              isCurrent: () => active === operation,
              onProgress() {},
              complete() {},
              fail() {},
              finish() { if (active === operation) { active = null; setIsLoading(false) } },
            }
            active = operation
            setIsLoading(true)
            return operation
          }, [])
          const cancel = react.useCallback(() => { active = null }, [])
          return { isLoading, progress: null, begin, cancel, continueBrowsing() {} }
        },
      },
    }))
  await mounted.settle()
  const view = mounted
  return {
    calls, toasts, imageId, popularRows,
    shown: () => {
      const node = view.query(n => n.type === ui.CaptionViewV2)
      return node ? { total: node.props.totalCount, content: node.props.content } : null
    },
    status: () => view.findAll(n => n.props.role === 'status').map(textOf),
    button: label => view.query(n => n.type === 'button' && textOf(n).includes(label)),
    async click(label) {
      await view.find(n => n.type === 'button' && textOf(n).includes(label)).props.onClick()
      await view.settle()
    },
  }
}

const generated = (imageId, count = 4) => () => saved(imageId, count)
  .map((row, n) => ({ ...row, content: `New ${n + 1}`, is_public: false, profile_id: 'me' }))

// --- Without a caption API (the Vercel deployment) ------------------------------------------

test('[mock] without a caption API, a banger with few captions shows all of them quietly',
  async () => {
    const page = await renderPage({ session: session({ apiUrl: null }), popular: 3 })
    assert.deepEqual(page.shown(), { total: 3, content: 'Saved 1' })
    assert.equal(page.calls.generate, 0)
    assert.deepEqual(page.status(), [], 'nothing went wrong, so nothing to explain')
    assert.deepEqual(page.toasts, [])
  })

test('[mock] without a caption API, Crack Again shows the rest without a request', async () => {
  const page = await renderPage({ session: session({ apiUrl: null }), popular: 13 })
  assert.equal(page.shown().total, 10)
  await page.click('Crack Again')
  assert.equal(page.shown().total, 13, 'the 3 remaining saved captions are added')
  assert.equal(page.calls.generate, 0)
  assert.equal(page.toasts.at(-1).title, 'These are the last saved captions')
  await page.click('Crack Again')
  assert.equal(page.calls.generate, 0)
  assert.equal(page.toasts.at(-1).title, 'No more captions yet')
})

test('[mock] without a caption API, a banger with no captions shows an empty state', async () => {
  const page = await renderPage({ session: session({ apiUrl: null }), popular: 0 })
  assert.equal(page.shown(), null)
  assert.match(page.status()[0], /No captions for this image yet.*can’t be generated on this site/)
  assert.equal(page.button('Get captions'), null, 'no button that can only fail')
  assert.equal(page.button('Try again'), null)
  assert.equal(page.calls.generate, 0)
  assert.deepEqual(page.toasts, [])
})

test('[mock] without a caption API, a private image shows the empty state without loading',
  async () => {
    const page = await renderPage({ session: session({ apiUrl: null }), isCommonUse: false })
    assert.equal(page.calls.begin, 0, 'no loading screen for work that cannot start')
    assert.equal(page.calls.generate, 0)
    assert.match(page.status()[0], /can’t be generated on this site/)
  })

// --- With a compatible backend ---------------------------------------------------------------

test('[mock] enough saved captions never trigger generation', async () => {
  const page = await renderPage({ popular: 12 })
  assert.equal(page.shown().total, 10)
  assert.equal(page.calls.generate, 0)
})

test('[mock] a compatible backend still tops up a banger automatically', async () => {
  const imageId = randomUUID()
  const page = await renderPage({ imageId, popular: 3, generate: generated(imageId) })
  assert.equal(page.calls.generate, 1)
  assert.deepEqual(page.shown(), { total: 7, content: 'Saved 1' })
  assert.deepEqual(page.status(), [])
})

test('[mock] a private image still generates automatically', async () => {
  const imageId = randomUUID()
  const page = await renderPage({ imageId, isCommonUse: false, generate: generated(imageId) })
  assert.equal(page.calls.generate, 1)
  assert.deepEqual(page.shown(), { total: 4, content: 'New 1' })
})

test('[mock] Crack Again pages through saved captions before generating', async () => {
  const imageId = randomUUID()
  const page = await renderPage({ imageId, popular: 23, generate: generated(imageId) })
  await page.click('Crack Again')
  assert.equal(page.calls.generate, 0, 'ten more saved captions were available')
  assert.equal(page.shown().total, 20)
  await page.click('Crack Again')
  assert.equal(page.calls.generate, 1, 'three saved remain, so generation tops them up')
  assert.equal(page.shown().total, 27)
})

test('[mock] saved captions shown for a notification are left alone', async () => {
  const imageId = randomUUID()
  const page = await renderPage({ imageId, initialCaptions: saved(imageId, 2) })
  assert.equal(page.calls.fetch, 0)
  assert.equal(page.calls.generate, 0)
  assert.equal(page.shown().total, 2)
})

// --- Failures keep saved captions and stop repeated requests ---------------------------------

test('[mock] a backend that refuses shared images keeps saved captions and is not asked again',
  async () => {
    const s = session()
    const refuse = () => {
      throw new CaptionJobRequestError(403, 'Unable to start captions (403).', 'image_not_local')
    }
    const first = await renderPage({ session: s, popular: 3, generate: refuse })
    assert.equal(first.calls.generate, 1)
    assert.equal(first.shown().total, 3, 'saved captions are kept')
    assert.match(first.status()[0],
      /Showing 3 saved captions\. .*can’t generate captions for shared/)
    assert.deepEqual(first.toasts, [], 'no error state')
    mounted.unmount()

    const other = await renderPage({ session: s, popular: 2, generate: refuse })
    assert.equal(other.calls.generate, 0, 'another banger in the same session asks nothing')
    assert.equal(other.shown().total, 2)
    await other.click('Crack Again')
    assert.equal(other.calls.generate, 0)
    mounted.unmount()

    const imageId = randomUUID()
    const mine = await renderPage({ session: s, imageId, isCommonUse: false,
      generate: generated(imageId) })
    assert.equal(mine.calls.generate, 1, 'your own images still generate')
  })

for (const [name, failure] of [
  ['unreachable', () => { throw new TypeError('fetch failed') }],
  ['erroring', () => { throw new CaptionJobRequestError(503, 'Unable to start captions (503).') }],
  ['rate limited', () => {
    throw new CaptionJobRequestError(429, 'Unable to start captions (429).')
  }],
  ['refusing paid calls', () => {
    throw new CaptionJobRequestError(400, 'Caption generation is turned off.',
      'paid_calls_disabled')
  }],
]) {
  test(`[mock] an ${name} backend is paused for a few minutes, for every image`, async () => {
    const s = session()
    const first = await renderPage({ session: s, popular: 4, generate: failure })
    assert.equal(first.shown().total, 4)
    assert.match(first.status()[0], /isn’t available right now/)
    mounted.unmount()

    const imageId = randomUUID()
    const again = await renderPage({ session: s, imageId, isCommonUse: false,
      generate: generated(imageId) })
    assert.equal(again.calls.generate, 0, 'no repeated request while paused')
    assert.match(again.status()[0], /isn’t available right now/)
    assert.equal(again.button('Try again'), null)
    mounted.unmount()

    s.clock.now += BACKEND_RETRY_AFTER_MS + 1
    const later = await renderPage({ session: s, imageId, isCommonUse: false,
      generate: generated(imageId) })
    assert.equal(later.calls.generate, 1, 'tried again after the pause')
    assert.equal(later.shown().total, 4)
  })
}

test('[mock] a failed job is not retried automatically, but the user can retry it', async () => {
  const s = session()
  const imageId = randomUUID()
  const fail = () => { throw new Error('No captions could be generated for this image.') }
  const first = await renderPage({ session: s, imageId, popular: 0, generate: fail })
  assert.match(first.status()[0], /couldn’t be generated for this image/)
  mounted.unmount()

  const page = await renderPage({ session: s, imageId, popular: 0, generate: generated(imageId) })
  assert.equal(page.calls.generate, 0, 'revisiting does not retry by itself')
  await page.click('Try again')
  assert.equal(page.calls.generate, 1, 'an explicit click does')
  assert.equal(page.shown().total, 4)
})

test('[mock] an image the backend refuses is never requested again this session', async () => {
  const s = session()
  const imageId = randomUUID()
  const refuse = () => { throw new CaptionJobRequestError(404, 'Unable to start captions (404).') }
  await renderPage({ session: s, imageId, isCommonUse: false, generate: refuse })
  mounted.unmount()
  const page = await renderPage({ session: s, imageId, isCommonUse: false, generate: refuse })
  assert.equal(page.calls.generate, 0)
  assert.equal(page.button('Try again'), null)
  assert.match(page.status()[0], /can’t generate captions for this image/)
})

test('[mock] a sign-in or busy error is explained but does not block later attempts', async () => {
  const s = session()
  const imageId = randomUUID()
  const failures = [
    new CaptionJobRequestError(401, 'Please sign in again to generate captions.'),
    new CaptionJobRequestError(409, 'Captions are already being generated for this image.',
      'generation_in_progress'),
  ]
  for (const failure of failures) {
    const page = await renderPage({ session: s, imageId, popular: 2,
      generate: () => { throw failure } })
    assert.equal(page.calls.generate, 1, 'each visit may try again')
    assert.equal(page.shown().total, 2)
    assert.ok(page.status()[0].includes(failure.message))
    mounted.unmount()
  }
})

test('[mock] a failed Crack Again keeps every caption and explains why', async () => {
  const imageId = randomUUID()
  let attempts = 0
  const page = await renderPage({ imageId, isCommonUse: false,
    generate: (...args) => {
      attempts += 1
      if (attempts === 1) return generated(imageId)(...args)
      throw new TypeError('fetch failed')
    } })
  assert.equal(page.shown().total, 4)
  await page.click('Crack Again')
  assert.equal(page.shown().total, 4, 'nothing is replaced or cleared')
  assert.equal(page.toasts.at(-1).title, 'No new captions')
  assert.match(page.toasts.at(-1).description, /isn’t available/)
  await page.click('Crack Again')
  assert.equal(page.calls.generate, 2, 'the paused backend is not asked again')
})

// --- The availability rules themselves -------------------------------------------------------

test('[mock] availability survives a reload through session storage and ignores bad data',
  () => {
    const store = memoryStore()
    const make = () => createCaptionGenerationAvailability({ apiUrl: 'http://a', storage: store,
      now: () => 5 })
    make().recordFailure('img', new TypeError('down'), { isCommonUse: false })
    assert.deepEqual(make().check('img', { isCommonUse: false, automatic: true }),
      { ok: false, reason: 'backend-unavailable' })
    store.setItem('caption-generation-availability:http://a', '{not json')
    assert.deepEqual(make().check('img', { isCommonUse: false, automatic: true }), { ok: true })
    const broken = createCaptionGenerationAvailability({ apiUrl: 'http://a',
      storage: {
        getItem() { throw new Error('blocked') },
        setItem() { throw new Error('blocked') },
      } })
    broken.recordFailure('img', new TypeError('down'), { isCommonUse: false })
    assert.equal(broken.check('img', { isCommonUse: false, automatic: true }).ok, false,
      'works from memory when storage is blocked')
  })

test('[mock] availability is kept per API, and success clears a pause', () => {
  const store = memoryStore()
  const local = createCaptionGenerationAvailability({ apiUrl: 'http://local', storage: store })
  const other = createCaptionGenerationAvailability({ apiUrl: 'http://other', storage: store })
  local.recordFailure('img', new TypeError('down'), { isCommonUse: false })
  assert.equal(other.check('img', { isCommonUse: false, automatic: true }).ok, true)
  local.recordSuccess('img')
  assert.equal(local.check('img', { isCommonUse: false, automatic: true }).ok, true)
})

test('[mock] cancellation is never recorded as a failure', () => {
  const availability = createCaptionGenerationAvailability({ apiUrl: 'http://a' })
  assert.equal(availability.recordFailure('img', new DOMException('x', 'AbortError'),
    { isCommonUse: true }), null)
  assert.equal(availability.check('img', { isCommonUse: true, automatic: true }).ok, true)
})

test('[mock] the remembered image list stays bounded', () => {
  const store = memoryStore()
  const availability = createCaptionGenerationAvailability({ apiUrl: 'http://a', storage: store })
  for (let n = 0; n < 250; n++) {
    availability.recordFailure(`img-${n}`, new Error('failed'), { isCommonUse: false })
  }
  const saved = JSON.parse(store.getItem('caption-generation-availability:http://a'))
  assert.equal(Object.keys(saved.images).length, 200)
  assert.equal(saved.images['img-249'], 'image-failed')
  assert.equal(saved.images['img-0'], undefined)
})

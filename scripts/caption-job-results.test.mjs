import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const { outputText } = ts.transpileModule(readFileSync(new URL(
  '../src/app/caption-job/[jobId]/page.tsx', import.meta.url,
), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX },
})
const user = { id: randomUUID(), app_metadata: {} }
const session = { access_token: 'signed-in-user-jwt', user }
const image = { id: randomUUID(), url: '/image.png', is_common_use: true }
const caption = () => ({ id: randomUUID(), image_id: image.id, content: 'Saved job caption',
  is_public: false, profile_id: user.id, humor_flavor_id: null })

function loadPage({ rows = [caption()], currentUser = user, currentSession = session,
  status = 'completed', httpStatus = 200, savedImage = image, captionError = null,
  responseBody, jobId = randomUUID(), captionIds = rows.map(row => row.id) } = {}) {
  const requests = []
  const queries = []
  let clients = 0
  const supabase = {
    auth: {
      getUser: async () => ({ data: { user: currentUser } }),
      getSession: async () => ({ data: { session: currentSession } }),
    },
    from(table) {
      const query = { table, filters: {} }
      queries.push(query)
      return {
        select() { return this },
        eq(key, value) { query.filters[key] = value; return this },
        async single() { return { data: savedImage, error: null } },
        async in(key, ids) {
          query.ids = ids
          return { data: rows.filter(row => ids.includes(row[key])), error: captionError }
        },
      }
    },
  }
  const exports = {}
  const mocks = {
    '@/utils/supabase/server': { createClient: async () => { clients++; return supabase } },
    '@/app/image/[imageId]/captions/image-captions-page-client': {
      ImageCaptionsPageClient: () => null,
    },
    'next/link': { default: () => null },
    'next/navigation': {
      notFound: () => { throw new Error('NOT_FOUND') },
      redirect: path => { throw new Error(`REDIRECT:${path}`) },
    },
  }
  // Run the real server page; replace only auth, network, and database boundaries.
  new Function('require', 'exports', 'fetch', 'process', outputText)(
    name => mocks[name] ?? require(name), exports,
    async (url, init) => {
      requests.push({ url, ...init })
      return Response.json(responseBody ?? { jobId, status, captionIds }, { status: httpStatus })
    },
    { env: { NEXT_PUBLIC_API_BASE_URL: 'https://api.example.test/' } },
  )
  return { requests, queries, jobId, clientCount: () => clients,
    render: (id = jobId) => exports.default({ params: Promise.resolve({ jobId: id }) }) }
}

test('job links fetch saved results with the user JWT and preserve all captions in job order',
  async () => {
    const rows = Array.from({ length: 13 }, caption)
    const ids = rows.map(row => row.id)
    const page = loadPage({ rows: [caption(), ...rows.toReversed()], captionIds: ids })
    const result = await page.render()
    assert.equal(page.requests.length, 1)
    assert.equal(page.requests[0].url,
      `https://api.example.test/pipeline/caption-job/${page.jobId}`)
    assert.equal(page.requests[0].method, 'GET', 'opening results never submits a generation')
    assert.equal(page.requests[0].cache, 'no-store')
    assert.deepEqual(page.requests[0].headers, { Authorization: `Bearer ${session.access_token}` })
    assert.ok(page.requests[0].signal instanceof AbortSignal)
    assert.deepEqual(result.props.initialCaptions.map(row => row.id), ids)
    assert.equal(result.props.imageUrl, image.url)
    assert.equal(result.key, page.jobId)
    assert.deepEqual(page.queries[1].filters, { id: image.id })
    const reopened = await page.render()
    assert.deepEqual(reopened.props.initialCaptions, result.props.initialCaptions)
    assert.equal(page.requests.length, 2, 'reopening loads persisted job results again')
  })

test('different jobs for the same image have distinct carousel keys and results', async () => {
  const first = await loadPage().render()
  const second = await loadPage().render()
  assert.equal(first.props.imageId, second.props.imageId)
  assert.notEqual(first.key, second.key)
  assert.notEqual(first.props.initialCaptions[0].id, second.props.initialCaptions[0].id)
})

test('partially completed jobs display their successful captions', async () => {
  const row = caption()
  const page = await loadPage({ status: 'partially_completed', rows: [row] }).render()
  assert.deepEqual(page.props.initialCaptions.map(c => c.id), [row.id])
})

test('queued, running, failed, and empty jobs show a status without starting generation', async () => {
  for (const status of ['queued', 'running', 'failed', 'completed']) {
    const page = loadPage({ status, captionIds: status === 'failed' ? [randomUUID()] : [] })
    const result = await page.render()
    assert.equal(result.type, 'div')
    assert.equal(result.props.initialCaptions, undefined)
    assert.equal(page.requests.length, 1)
    assert.equal(page.requests[0].method, 'GET')
    assert.deepEqual(page.queries, [])
  }
})

test('job results require a verified non-anonymous user and matching session', async () => {
  for (const options of [
    { currentUser: null },
    { currentUser: { ...user, is_anonymous: true } },
    { currentUser: { ...user, app_metadata: { provider: 'anonymous' } } },
    { currentSession: null },
    { currentSession: { ...session, user: { id: randomUUID() } } },
  ]) {
    const page = loadPage(options)
    await assert.rejects(page.render(), /REDIRECT:\/login/)
    assert.deepEqual(page.requests, [])
    assert.deepEqual(page.queries, [])
  }
})

test('invalid job IDs are rejected before accessing auth or the API', async () => {
  const page = loadPage()
  for (const id of ['invalid', '../other', '']) {
    await assert.rejects(page.render(id), /NOT_FOUND/)
  }
  assert.equal(page.clientCount(), 0)
  assert.deepEqual(page.requests, [])
})

test('job API authorization, missing jobs, and server failures do not fall back to generation',
  async () => {
    for (const [httpStatus, error] of [
      [401, /REDIRECT:\/login/], [403, /NOT_FOUND/], [404, /NOT_FOUND/],
      [500, /Unable to load this caption job/],
    ]) {
      const page = loadPage({ httpStatus })
      await assert.rejects(page.render(), error)
      assert.deepEqual(page.queries, [])
      assert.equal(page.requests.length, 1)
    }
  })

test('malformed job responses are rejected before querying captions', async () => {
  const jobId = randomUUID()
  for (const responseBody of [
    {}, { jobId: randomUUID(), status: 'completed', captionIds: [] },
    { jobId, status: 'unknown', captionIds: [] },
    { jobId, status: 'completed', captionIds: ['bad-id'] },
    { jobId, status: 'completed', captionIds: {} },
  ]) {
    const page = loadPage({ jobId, responseBody })
    await assert.rejects(page.render(), /caption job response was invalid/)
    assert.deepEqual(page.queries, [])
  }
})

test('missing captions, inaccessible images, and mixed-image results do not show unrelated data',
  async () => {
    for (const options of [
      { captionIds: [randomUUID()] },
      { savedImage: null },
      { rows: [caption(), { ...caption(), image_id: randomUUID() }] },
    ]) {
      await assert.rejects(loadPage(options).render(), /NOT_FOUND/)
    }
    await assert.rejects(loadPage({ captionError: new Error('Unavailable') }).render(),
      /Unable to load your captions/)
  })

test('large caption jobs load in batches without losing or duplicating captions', async () => {
  const rows = Array.from({ length: 105 }, caption)
  const ids = rows.map(row => row.id)
  const page = loadPage({ rows: rows.toReversed(), captionIds: [...ids, ids[0]] })
  const result = await page.render()
  assert.deepEqual(result.props.initialCaptions.map(c => c.id), ids)
  assert.deepEqual(page.queries.filter(query => query.table === 'captions')
    .map(query => query.ids.length), [100, 5])
})

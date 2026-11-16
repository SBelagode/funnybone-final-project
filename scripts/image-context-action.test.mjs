// Mock tests: Supabase and the caption API are stubbed, so these do not exercise real RLS.
// The stub table applies the same filters a real query would (owner, shared flag and the
// compare-and-set on additional_context), so a missing filter makes a test fail.
import { afterEach, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { loadModule } from './support/render-component.mjs'
import * as imageNudge from '../src/utils/image-nudge.ts'
import { fetchCaptionApiState } from '../src/utils/caption-api-state.ts'

const contextRefinement = loadModule('utils/context-refinement.ts',
  { '@/utils/image-nudge': imageNudge })
const user = { id: randomUUID(), app_metadata: {} }
const otherUser = randomUUID()
const token = 'user-access-token'
const supported = { supportsContextSnapshots: true, activeJob: false }

let rows
let previousFlag
beforeEach(() => {
  rows = new Map()
  previousFlag = process.env.ENABLE_NUDGE_PERSISTENCE
  process.env.ENABLE_NUDGE_PERSISTENCE = 'true'
})
afterEach(() => {
  if (previousFlag === undefined) delete process.env.ENABLE_NUDGE_PERSISTENCE
  else process.env.ENABLE_NUDGE_PERSISTENCE = previousFlag
})

function seed(overrides = {}) {
  const row = { id: randomUUID(), profile_id: user.id, is_common_use: false,
    additional_context: null, ...overrides }
  rows.set(row.id, row)
  return row
}

const matches = (row, filters) => filters.every(([kind, column, a, b]) => {
  if (kind === 'eq') return row[column] === a
  if (kind === 'is') return row[column] === a
  if (kind === 'not') return !(a === 'is' && row[column] === b)
  throw new Error(`unexpected filter ${kind}`)
})

function loadAction({ currentUser = user, session = { access_token: token },
  apiState = async () => supported, updateError = null, readError = null } = {}) {
  const calls = { clients: 0, queries: [], api: [] }
  const supabase = {
    auth: {
      getUser: async () => ({ data: { user: currentUser } }),
      getSession: async () => ({ data: { session } }),
    },
    from(table) {
      const query = { table, op: null, filters: [], values: null }
      calls.queries.push(query)
      const builder = {
        select(columns) {
          if (query.op !== 'update') {
            query.op = 'select'
            query.columns = columns
            return builder
          }
          if (updateError) return Promise.resolve({ data: null, error: updateError })
          const updated = [...rows.values()].filter(row => matches(row, query.filters))
          for (const row of updated) Object.assign(row, query.values)
          return Promise.resolve({ data: updated.map(({ id }) => ({ id })), error: null })
        },
        update(values) { query.op = 'update'; query.values = values; return builder },
        eq(column, value) { query.filters.push(['eq', column, value]); return builder },
        is(column, value) { query.filters.push(['is', column, value]); return builder },
        not(column, operator, value) {
          query.filters.push(['not', column, operator, value])
          return builder
        },
        async maybeSingle() {
          if (readError) return { data: null, error: readError }
          const row = [...rows.values()].find(candidate => matches(candidate, query.filters))
          return { data: row ? { id: row.id, additional_context: row.additional_context } : null,
            error: null }
        },
      }
      return builder
    },
  }
  const actions = loadModule('app/actions/images/image-context-action.ts', {
    '@/utils/context-refinement': contextRefinement,
    '@/utils/caption-api-state': {
      fetchCaptionApiState: async (imageId, accessToken) => {
        calls.api.push({ imageId, accessToken })
        return apiState(imageId)
      },
    },
    '@/utils/supabase/server': {
      createClient: async () => { calls.clients += 1; return supabase },
    },
  })
  const updates = () => calls.queries.filter(query => query.op === 'update')
  return { ...actions, calls, updates }
}

const update = (action, imageId, request) => action.updateImageContextAction(imageId, request)

// ---- Saving --------------------------------------------------------------------------------

for (const [mode, text, saved, expected] of [
  ['append', 'Coffee ran out', 'Exam week', 'Exam week\nCoffee ran out'],
  ['append', 'Coffee ran out', null, 'Coffee ran out'],
  ['replace', '  Graduation day ', 'Exam week', 'Graduation day'],
  ['clear', '', 'Exam week', null],
]) {
  test(`[mock] ${mode} from ${JSON.stringify(saved)} saves ${JSON.stringify(expected)}`,
    async () => {
      const row = seed({ additional_context: saved })
      const action = loadAction()
      const result = await update(action, row.id, { mode, text, expected: saved })
      assert.deepEqual(result, { ok: true, context: expected })
      assert.equal(row.additional_context, expected)
      const [query] = action.updates()
      assert.deepEqual(query.values, { additional_context: expected, modified_by_user_id: user.id })
      assert.deepEqual(query.filters, [
        ['eq', 'id', row.id],
        ['eq', 'profile_id', user.id],
        ['not', 'is_common_use', 'is', true],
        saved === null ? ['is', 'additional_context', null] : ['eq', 'additional_context', saved],
      ])
    })
}

test('[mock] keep writes nothing and returns the saved context', async () => {
  const row = seed({ additional_context: 'Exam week' })
  const action = loadAction()
  assert.deepEqual(await update(action, row.id, { mode: 'keep', expected: 'Exam week' }),
    { ok: true, context: 'Exam week' })
  assert.equal(action.updates().length, 0)
  assert.equal(action.calls.api.length, 1, 'keep still checks for an active job')
})

test('[mock] replacing with the same text writes nothing', async () => {
  const row = seed({ additional_context: 'Exam week' })
  const action = loadAction()
  const result = await update(action, row.id,
    { mode: 'replace', text: 'Exam week', expected: 'Exam week' })
  assert.deepEqual(result, { ok: true, context: 'Exam week' })
  assert.equal(action.updates().length, 0)
})

test('[mock] the combined context is validated on the server', async () => {
  const row = seed({ additional_context: 'a'.repeat(200) })
  const action = loadAction()
  const tooLong = await update(action, row.id,
    { mode: 'append', text: 'b'.repeat(80), expected: 'a'.repeat(200) })
  assert.equal(tooLong.ok, false)
  assert.equal(tooLong.code, 'invalid')
  assert.match(tooLong.error, /281 characters/)
  const placeholder = await update(action, row.id,
    { mode: 'append', text: '${step1Output}', expected: 'a'.repeat(200) })
  assert.equal(placeholder.code, 'invalid')
  for (const mode of ['append', 'replace']) {
    assert.equal((await update(action, row.id,
      { mode, text: '   ', expected: 'a'.repeat(200) })).code, 'invalid')
  }
  assert.equal(action.updates().length, 0)
  assert.equal(row.additional_context, 'a'.repeat(200))
})

test('[mock] a stale expected context is a conflict and returns the current value', async () => {
  const row = seed({ additional_context: 'Changed elsewhere' })
  const action = loadAction()
  const result = await update(action, row.id,
    { mode: 'append', text: 'Mine', expected: 'Exam week' })
  assert.equal(result.code, 'conflict')
  assert.equal(result.current, 'Changed elsewhere')
  assert.equal(action.updates().length, 0)
  assert.equal(action.calls.api.length, 0, 'refused before contacting the caption API')
})

test('[mock] a change between the read and the write is not overwritten', async () => {
  const row = seed({ additional_context: 'Exam week' })
  const action = loadAction({
    apiState: async () => {
      row.additional_context = 'Another tab won'
      return supported
    },
  })
  const result = await update(action, row.id,
    { mode: 'append', text: 'Mine', expected: 'Exam week' })
  assert.equal(result.code, 'conflict')
  assert.equal(row.additional_context, 'Another tab won')
})

// ---- Who and what can change -----------------------------------------------------------

test('[mock] another user’s image cannot be read or changed', async () => {
  const row = seed({ profile_id: otherUser, additional_context: 'Theirs' })
  const action = loadAction()
  const result = await update(action, row.id, { mode: 'clear', expected: 'Theirs' })
  assert.equal(result.code, 'not-found')
  assert.equal(action.updates().length, 0)
  assert.equal(row.additional_context, 'Theirs')
  assert.equal((await action.getImageContextAction(row.id)).ok, false)
})

for (const [name, overrides] of [
  ['a banger the user owns', { is_common_use: true }],
  ['another user’s banger', { is_common_use: true, profile_id: otherUser }],
]) {
  test(`[mock] ${name} cannot be changed`, async () => {
    const row = seed({ ...overrides, additional_context: 'Shared' })
    const action = loadAction()
    const result = await update(action, row.id,
      { mode: 'replace', text: 'Mine now', expected: 'Shared' })
    assert.equal(result.code, 'not-found')
    assert.equal(row.additional_context, 'Shared')
    assert.equal(action.updates().length, 0)
  })
}

for (const [name, options] of [
  ['no user', { currentUser: null }],
  ['an anonymous user', { currentUser: { ...user, is_anonymous: true } }],
  ['an anonymous provider', { currentUser: { ...user, app_metadata: { provider: 'anonymous' } } }],
]) {
  test(`[mock] ${name} cannot change context`, async () => {
    const row = seed({ additional_context: 'Exam week' })
    const action = loadAction(options)
    const result = await update(action, row.id, { mode: 'clear', expected: 'Exam week' })
    assert.equal(result.ok, false)
    assert.match(result.error, /sign in/)
    assert.equal(action.calls.queries.length, 0)
    assert.equal(row.additional_context, 'Exam week')
  })
}

test('[mock] malformed requests are refused before touching Supabase', async () => {
  const row = seed()
  const action = loadAction()
  for (const [imageId, request] of [
    [row.id, { mode: 'delete', expected: null }],
    [row.id, { mode: 'append', text: 42, expected: null }],
    [row.id, { mode: 'keep', expected: 7 }],
    [row.id, null],
    ['not-a-uuid', { mode: 'keep', expected: null }],
  ]) {
    assert.equal((await update(action, imageId, request)).ok, false)
  }
  assert.equal(action.calls.clients, 0)
})

test('[mock] the persistence flag must be exactly "true"', async () => {
  const row = seed()
  for (const value of [undefined, 'false', 'TRUE', '1']) {
    if (value === undefined) delete process.env.ENABLE_NUDGE_PERSISTENCE
    else process.env.ENABLE_NUDGE_PERSISTENCE = value
    const action = loadAction()
    const result = await update(action, row.id, { mode: 'append', text: 'x', expected: null })
    assert.equal(result.code, 'unavailable')
    assert.equal(action.calls.clients, 0)
    const info = await action.getImageContextAction(row.id)
    assert.equal(info.refinement, false)
  }
})

// ---- Caption API capability and active jobs ---------------------------------------------

test('[mock] an API without context snapshots blocks every change', async () => {
  const row = seed({ additional_context: 'Exam week' })
  const action = loadAction({
    apiState: async () => ({ supportsContextSnapshots: false, activeJob: false }),
  })
  for (const mode of ['keep', 'append', 'replace', 'clear']) {
    const result = await update(action, row.id, { mode, text: 'x', expected: 'Exam week' })
    assert.equal(result.code, 'unavailable', mode)
  }
  assert.equal(action.updates().length, 0)
})

test('[mock] an unreachable API or missing session fails closed', async () => {
  const row = seed({ additional_context: 'Exam week' })
  for (const options of [
    { apiState: async () => { throw new TypeError('fetch failed') } },
    { session: null },
  ]) {
    const action = loadAction(options)
    const result = await update(action, row.id,
      { mode: 'append', text: 'x', expected: 'Exam week' })
    assert.equal(result.code, 'unavailable')
    assert.equal(action.updates().length, 0)
  }
})

test('[mock] an active job for the image blocks the change', async () => {
  const row = seed({ additional_context: 'Exam week' })
  const action = loadAction({ apiState: async () => ({ ...supported, activeJob: true }) })
  const result = await update(action, row.id, { mode: 'clear', expected: 'Exam week' })
  assert.equal(result.code, 'busy')
  assert.equal(row.additional_context, 'Exam week')
})

test('[mock] the caption API is asked with the signed-in user’s token', async () => {
  const row = seed()
  const action = loadAction()
  await update(action, row.id, { mode: 'append', text: 'x', expected: null })
  assert.deepEqual(action.calls.api, [{ imageId: row.id, accessToken: token }])
})

test('[mock] database errors are logged by code only', async () => {
  const row = seed({ additional_context: 'Private made-up context' })
  const logged = []
  const original = console.error
  console.error = (...args) => logged.push(args.join(' '))
  try {
    const action = loadAction({
      updateError: { code: '23514', message: 'row contains Private made-up context' },
    })
    const result = await update(action, row.id,
      { mode: 'append', text: 'x', expected: 'Private made-up context' })
    assert.equal(result.code, 'failed')
  } finally {
    console.error = original
  }
  assert.deepEqual(logged, ['Error saving image context: 23514'])
})

// ---- Loading the panel ------------------------------------------------------------------

test('[mock] the panel info reports the context and whether refinement is safe', async () => {
  const row = seed({ additional_context: '  Exam week  ' })
  assert.deepEqual(await loadAction().getImageContextAction(row.id),
    { ok: true, context: 'Exam week', refinement: true, activeJob: false, notice: null })

  const busy = await loadAction({ apiState: async () => ({ ...supported, activeJob: true }) })
    .getImageContextAction(row.id)
  assert.equal(busy.activeJob, true)
  assert.match(busy.notice, /still being generated/)

  const legacy = await loadAction({
    apiState: async () => ({ supportsContextSnapshots: false, activeJob: false }),
  }).getImageContextAction(row.id)
  assert.equal(legacy.refinement, false)
  assert.match(legacy.notice, /Keep existing context/)

  const down = await loadAction({ apiState: async () => { throw new Error('down') } })
    .getImageContextAction(row.id)
  assert.equal(down.refinement, false)
})

test('[mock] the panel info is refused for shared images and signed-out users', async () => {
  const banger = seed({ is_common_use: true })
  assert.equal((await loadAction().getImageContextAction(banger.id)).ok, false)
  assert.equal((await loadAction({ currentUser: null }).getImageContextAction(seed().id)).ok,
    false)
})

// ---- The capability check itself --------------------------------------------------------

test('[mock] the capability check reads the image state route with the user token',
  async () => {
    const requests = []
    const state = await fetchCaptionApiState('abc', 'jwt', {
      apiUrl: 'http://127.0.0.1:4010/',
      fetchImpl: async (url, init) => {
        requests.push({ url, auth: init.headers.Authorization, method: init.method })
        return Response.json({ supportsContextSnapshots: true, activeJob: true })
      },
    })
    assert.deepEqual(state, { supportsContextSnapshots: true, activeJob: true })
    assert.deepEqual(requests, [{ url: 'http://127.0.0.1:4010/pipeline/image-generation-state/abc',
      auth: 'Bearer jwt', method: 'GET' }])
  })

test('[mock] an API without the route, or with an unexpected answer, is unsupported',
  async () => {
    const unsupported = { supportsContextSnapshots: false, activeJob: false }
    for (const response of [
      new Response('Not found', { status: 404 }),
      new Response('Forbidden', { status: 403 }),
      Response.json({ supportsContextSnapshots: 'yes', activeJob: false }),
      Response.json({ supportsContextSnapshots: true }),
      new Response('not json'),
    ]) {
      assert.deepEqual(await fetchCaptionApiState('abc', 'jwt',
        { apiUrl: 'http://api.test', fetchImpl: async () => response }), unsupported)
    }
    assert.deepEqual(await fetchCaptionApiState('abc', 'jwt', { apiUrl: '' }), unsupported)
  })

test('[mock] a network failure is reported, not mistaken for "unsupported"', async () => {
  await assert.rejects(fetchCaptionApiState('abc', 'jwt', {
    apiUrl: 'http://api.test',
    fetchImpl: async () => { throw new TypeError('fetch failed') },
  }), TypeError)
})

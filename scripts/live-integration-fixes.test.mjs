// Mock tests for the live-integration fixes: the private image proxy, verified access tokens,
// and the vote and bookmark payloads that migration 032 allows. Real modules, with Supabase and
// the network stubbed. No request leaves this process.
import { afterEach, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { loadModule } from './support/render-component.mjs'

const apiUrl = 'http://127.0.0.1:4020'
const sha = 'a'.repeat(64)
const stored = `${apiUrl}/local-images/content/${sha}`
const userId = randomUUID()
const jwt = payload => `h.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.s`
const userToken = jwt({ sub: userId, role: 'authenticated' })

let savedEnv
let savedFetch
beforeEach(() => {
  savedEnv = process.env.NEXT_PUBLIC_API_BASE_URL
  savedFetch = globalThis.fetch
  process.env.NEXT_PUBLIC_API_BASE_URL = apiUrl
})
afterEach(() => {
  if (savedEnv === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL
  else process.env.NEXT_PUBLIC_API_BASE_URL = savedEnv
  globalThis.fetch = savedFetch
})

const accessToken = () => loadModule('utils/access-token.ts')
const display = () => loadModule('utils/display-image-url.ts')

// A cookie-backed Supabase client. Reading session.user throws, as a reminder that it is
// unverified: the code under test must never touch it.
function supabase({ user = { id: userId }, token = userToken, visibleUrls = [stored], inserts } = {}) {
  const calls = []
  const session = token === null ? null : Object.defineProperty({ access_token: token }, 'user', {
    get() { throw new Error('session.user is unverified and must not be read') },
  })
  const client = {
    calls,
    auth: {
      getUser: async () => ({ data: { user } }),
      getSession: async () => ({ data: { session } }),
    },
    from(table) {
      const query = { table, filters: [] }
      calls.push(query)
      const builder = {
        select(columns) { query.select = columns; return builder },
        eq(column, value) { query.filters.push([column, value]); return builder },
        limit() { return builder },
        async maybeSingle() {
          const url = query.filters.find(([column]) => column === 'url')?.[1]
          return { data: visibleUrls.includes(url) ? { id: 'image-1' } : null, error: null }
        },
        insert(payload) { query.insert = payload; return builder },
        upsert(payload) { query.upsert = payload; return builder },
        delete() { query.delete = true; return builder },
        order() { return builder },
        async single() { return inserts?.(query) ?? { data: { id: 1, ...query.insert }, error: null } },
        then(resolve) {
          return Promise.resolve(inserts?.(query) ?? { data: query.insert ? [query.insert] : null,
            error: null }).then(resolve)
        },
      }
      return builder
    },
  }
  return client
}

// --- Display URLs ------------------------------------------------------------------------------

test('[mock] local image references are shown through the same-origin proxy', () => {
  const { displayImageUrl, localImageKey } = display()
  assert.equal(displayImageUrl(stored, apiUrl), `/api/local-images/content/${sha}`)
  assert.equal(localImageKey(stored, `${apiUrl}/`), `content/${sha}`)
})

test('[mock] every other image URL is left untouched', () => {
  const { displayImageUrl } = display()
  for (const url of [
    'https://images.almostcrackd.ai/u/123.jpg',
    'blob:http://localhost:3000/abc',
    `${apiUrl}/local-images/content/${'A'.repeat(64)}`,
    `${apiUrl}/local-images/content/${sha}/../../secret`,
    `http://127.0.0.1:9999/local-images/content/${sha}`,
    '',
  ]) {
    assert.equal(displayImageUrl(url, apiUrl), url)
  }
  assert.equal(displayImageUrl(stored, ''), stored, 'no API configured: unchanged')
  assert.equal(displayImageUrl(null, apiUrl), null)
})

// --- The image proxy route -------------------------------------------------------------------

function proxy(client) {
  return loadModule('app/api/local-images/[...key]/route.ts', {
    '@/utils/supabase/server': { createClient: async () => client },
    '@/utils/access-token': accessToken(),
    '@/utils/display-image-url': display(),
  })
}
const imageBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0])
function upstream(status = 200, type = 'image/jpeg') {
  const requests = []
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), authorization: init?.headers?.Authorization, redirect: init?.redirect })
    return new Response(status === 200 ? imageBytes : null, { status, headers: { 'Content-Type': type } })
  }
  return requests
}
const get = (route, key) => route.GET(new Request(`http://localhost:3000/api/local-images/${key}`),
  { params: Promise.resolve({ key: key.split('/') }) })

test('[mock] the owner gets the image bytes, fetched with their own verified token', async () => {
  const requests = upstream()
  const client = supabase()
  const response = await get(proxy(client), `content/${sha}`)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('content-type'), 'image/jpeg')
  assert.equal(response.headers.get('cache-control'), 'private, max-age=300')
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), imageBytes)
  assert.deepEqual(requests, [{ url: stored, authorization: `Bearer ${userToken}`, redirect: 'manual' }])
  assert.deepEqual(client.calls[0].filters, [['url', stored]], 'access is checked for the exact URL')
})

test('[mock] an image the caller cannot read under RLS is not fetched at all', async () => {
  const requests = upstream()
  const response = await get(proxy(supabase({ visibleUrls: [] })), `content/${sha}`)
  assert.equal(response.status, 404)
  assert.deepEqual(requests, [])
})

test('[mock] a signed-out visitor is checked without any token', async () => {
  const requests = upstream()
  const response = await get(proxy(supabase({ user: null, token: null })), `content/${sha}`)
  assert.equal(response.status, 200, 'a public image is still shown')
  assert.equal(requests[0].authorization, undefined)
})

test('[mock] a session token for a different user is never forwarded', async () => {
  const requests = upstream()
  const client = supabase({ token: jwt({ sub: randomUUID(), role: 'authenticated' }) })
  await get(proxy(client), `content/${sha}`)
  assert.equal(requests[0].authorization, undefined)
})

test('[mock] malformed keys, upload targets and a missing API get 404 with no queries', async () => {
  const requests = upstream()
  for (const key of ['content/zz', `content/${sha}/extra`, `uploads/${randomUUID()}/${randomUUID()}`,
    '../etc/passwd', '']) {
    const client = supabase()
    assert.equal((await get(proxy(client), key)).status, 404, key)
    assert.deepEqual(client.calls, [])
  }
  delete process.env.NEXT_PUBLIC_API_BASE_URL
  assert.equal((await get(proxy(supabase()), `content/${sha}`)).status, 404)
  assert.deepEqual(requests, [])
})

test('[mock] only image responses are passed through', async () => {
  upstream(404)
  assert.equal((await get(proxy(supabase()), `content/${sha}`)).status, 404)
  upstream(200, 'text/html')
  assert.equal((await get(proxy(supabase()), `content/${sha}`)).status, 404)
  upstream(302, 'image/jpeg')
  assert.equal((await get(proxy(supabase()), `content/${sha}`)).status, 404, 'redirects are refused')
  globalThis.fetch = async () => { throw new TypeError('fetch failed') }
  assert.equal((await get(proxy(supabase()), `content/${sha}`)).status, 404)
})

// --- Verified access tokens ------------------------------------------------------------------

function tokenRoute(client) {
  return loadModule('app/api/auth/access-token/route.ts', {
    '@/utils/supabase/server': { createClient: async () => client },
    '@/utils/access-token': accessToken(),
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
  })
}

test('[mock] the access token is returned only for the verified user, without reading session.user',
  async () => {
    const response = await tokenRoute(supabase()).GET()
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { accessToken: userToken, userId })
  })

test('[mock] signed-out, anonymous and mismatched sessions get no token', async () => {
  const cases = [
    [supabase({ user: null }), 401],
    [supabase({ token: null }), 401],
    [supabase({ user: { id: userId, is_anonymous: true } }), 403],
    [supabase({ user: { id: userId, app_metadata: { provider: 'anonymous' } } }), 403],
    [supabase({ token: jwt({ sub: randomUUID(), role: 'authenticated' }) }), 403],
    [supabase({ token: jwt({ sub: userId, role: 'anon' }) }), 403],
  ]
  for (const [client, status] of cases) {
    const response = await tokenRoute(client).GET()
    assert.equal(response.status, status)
    assert.equal((await response.json()).accessToken, undefined)
  }
})

// --- Votes and bookmarks after migration 032 -------------------------------------------------

// Columns that 032 lets signed-in users insert (src: nonchalant-local proposed-migrations/032).
const INSERTABLE = {
  caption_votes: ['caption_id', 'profile_id', 'vote_value'],
  caption_saves: ['caption_id', 'profile_id'],
}
function action(path, client) {
  return loadModule(path, { '@/utils/supabase/server': { createClient: async () => client } })
}
const insertsOf = (client, table) => client.calls.filter(q => q.table === table && q.insert)

test('[mock] a vote inserts only the columns users may write, and returns the row', async () => {
  const client = supabase()
  const { toggleCaptionVoteAction } = action('app/actions/captions/toggle-caption-vote-action.ts',
    client)
  const vote = await toggleCaptionVoteAction('caption-1', 1)
  const [insert] = insertsOf(client, 'caption_votes')
  assert.deepEqual(Object.keys(insert.insert).sort(), [...INSERTABLE.caption_votes].sort())
  assert.deepEqual(insert.insert, { caption_id: 'caption-1', profile_id: userId, vote_value: 1 })
  assert.equal(vote.vote_value, 1, 'insert-and-return still gives the new vote')
})

test('[mock] voting follows the toggle rules: up, switch, remove', async () => {
  const votes = []
  const client = supabase({
    inserts(query) {
      if (query.table !== 'caption_votes') return undefined
      if (query.delete) { votes.length = 0; return { data: null, error: null } }
      if (query.insert) { votes.push(query.insert.vote_value); return { data: query.insert, error: null } }
      return { data: votes.length ? { vote_value: votes.at(-1) } : null, error: null }
    },
  })
  client.from = (original => table => {
    const builder = original(table)
    builder.maybeSingle = async () => ({ data: votes.length ? { vote_value: votes.at(-1) } : null,
      error: null })
    return builder
  })(client.from)
  const { toggleCaptionVoteAction } = action('app/actions/captions/toggle-caption-vote-action.ts',
    client)
  await toggleCaptionVoteAction('c', 1)
  assert.deepEqual(votes, [1], 'initial upvote')
  await toggleCaptionVoteAction('c', -1)
  assert.deepEqual(votes, [-1], 'switching replaces the vote')
  assert.equal(await toggleCaptionVoteAction('c', -1), null)
  assert.deepEqual(votes, [], 'the same vote again removes it')
  await toggleCaptionVoteAction('c', -1)
  assert.deepEqual(votes, [-1], 'initial downvote')
})

test('[mock] a bookmark is a plain insert of the two allowed columns, never an upsert', async () => {
  const client = supabase()
  const { insertSaveAction } = action('app/actions/captions/insert-save-action.ts', client)
  await insertSaveAction('caption-1')
  const saves = client.calls.filter(q => q.table === 'caption_saves')
  assert.equal(saves.some(q => q.upsert), false, 'upsert needs UPDATE, which users do not have')
  assert.deepEqual(saves[0].insert, { caption_id: 'caption-1', profile_id: userId })
  assert.deepEqual(Object.keys(saves[0].insert).sort(), [...INSERTABLE.caption_saves].sort())
})

test('[mock] bookmarking an already saved caption counts as saved', async () => {
  const client = supabase({
    inserts: () => ({ data: null, error: { code: '23505', message: 'duplicate key value' } }),
  })
  const { insertSaveAction } = action('app/actions/captions/insert-save-action.ts', client)
  assert.deepEqual(await insertSaveAction('caption-1'), [])
})

test('[mock] other bookmark errors are still reported', async () => {
  const client = supabase({
    inserts: () => ({ data: null, error: { code: '42501', message: 'permission denied' } }),
  })
  const { insertSaveAction } = action('app/actions/captions/insert-save-action.ts', client)
  await assert.rejects(insertSaveAction('caption-1'), error => error.code === '42501')
})

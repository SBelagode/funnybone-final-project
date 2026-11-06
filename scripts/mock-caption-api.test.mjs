// Mock tests: these spawn the real script against a fake Supabase server in this process.
// Your real project cannot be reached: no env file is loaded, and the child process receives
// only the variables listed in spawnMock. Every test asserts on the fake server's own records.
import { after, before, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { connect } from 'node:net'
import { networkInterfaces } from 'node:os'
import { fileURLToPath } from 'node:url'
import { runCaptionJob } from '../src/utils/caption-job-client.ts'

const repo = fileURLToPath(new URL('..', import.meta.url))
const publicKey = 'sb_publishable_fake-test-key'
const userA = { id: randomUUID(), token: 'user-a-secret-jwt' }
const userB = { id: randomUUID(), token: 'user-b-secret-jwt' }
const privateNudge = 'A made-up private nudge'

const images = new Map()
const captions = []
const traffic = []
let failCaptionInsert = false

const read = async request => {
  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  return Buffer.concat(chunks).toString()
}

const fakeSupabase = createServer(async (request, response) => {
  const url = new URL(request.url, 'http://fake')
  const json = (status, body) => {
    response.writeHead(status, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify(body))
  }
  traffic.push(`${request.method} ${url.pathname}`)
  const bearer = request.headers.authorization?.replace('Bearer ', '')
  const user = [userA, userB].find(candidate => candidate.token === bearer)

  if (url.pathname === '/auth/v1/user') {
    return user ? json(200, { id: user.id, aud: 'authenticated' })
      : json(401, { message: 'invalid JWT' })
  }
  if (!user) return json(401, { message: 'A user JWT is required for all table access.' })

  if (url.pathname === '/rest/v1/images' && request.method === 'POST') {
    const row = { id: randomUUID(), additional_context: null, ...JSON.parse(await read(request)) }
    images.set(row.id, row)
    return json(201, { id: row.id })
  }
  if (url.pathname === '/rest/v1/images' && request.method === 'GET') {
    const row = images.get(url.searchParams.get('id').replace('eq.', ''))
    const wantsObject = request.headers.accept?.includes('vnd.pgrst.object')
    return json(200, wantsObject ? row : [row].filter(Boolean))
  }
  if (url.pathname === '/rest/v1/captions' && request.method === 'POST') {
    if (failCaptionInsert) {
      return json(500, { code: '23514', message: `Failing row contains ${privateNudge}` })
    }
    const row = { id: randomUUID(), ...JSON.parse(await read(request)) }
    captions.push(row)
    return json(201, { id: row.id })
  }
  return json(404, {})
})

function spawnMock(env) {
  const child = spawn(process.execPath, ['scripts/mock-caption-api.mjs'], {
    cwd: repo,
    env: { PATH: process.env.PATH, MOCK_CAPTION_API_PORT: '0', ...env },
  })
  const output = { text: '' }
  child.stdout.on('data', data => { output.text += data })
  child.stderr.on('data', data => { output.text += data })
  const exited = new Promise(resolve => child.once('exit', resolve))
  return { child, exited, output }
}

async function startMock(env) {
  const started = spawnMock(env)
  for (let attempt = 0; attempt < 500 && !/Mock run: /.test(started.output.text); attempt++) {
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  const match = started.output.text.match(/http:\/\/127\.0\.0\.1:(\d+)/)
  if (!match) {
    started.child.kill()
    await started.exited
    assert.fail(`mock did not start on 127.0.0.1: ${started.output.text}`)
  }
  return { ...started, port: Number(match[1]), base: match[0] }
}

let mock
let fakeUrl
let runId

const call = (path, { method = 'POST', body, token = userA.token, key } = {}) =>
  fetch(`${mock.base}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
      'Idempotency-Key': key ?? randomUUID(),
    },
    body: method === 'GET' ? undefined
      : typeof body === 'string' ? body : JSON.stringify(body ?? {}),
  })

async function createMockImage(token = userA.token) {
  const response = await call('/pipeline/upload-image-from-url', {
    token,
    body: { imageUrl: 'https://example.test/photo.jpg', isCommonUse: false },
  })
  assert.equal(response.status, 200)
  return (await response.json()).imageId
}

function seedImage(overrides) {
  const row = {
    id: randomUUID(),
    url: 'https://images.example.test/imported.jpg',
    additional_context: null,
    profile_id: userA.id,
    is_common_use: false,
    is_public: false,
    ...overrides,
  }
  images.set(row.id, row)
  return row
}

async function assertRejected(imageId, token = userA.token) {
  const before = captions.length
  const response = await call('/pipeline/generate-captions', { token, body: { imageId } })
  assert.equal(response.status, 403)
  assert.match((await response.json()).error, /only captions images it created/)
  assert.equal(captions.length, before, 'a rejected image must not receive a caption')
}

before(async () => {
  await new Promise(resolve => fakeSupabase.listen(0, '127.0.0.1', resolve))
  fakeUrl = `http://127.0.0.1:${fakeSupabase.address().port}`
  mock = await startMock({
    NEXT_PUBLIC_SUPABASE_URL: fakeUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: publicKey,
  })
  runId = mock.output.text.match(/Mock run: ([0-9a-f-]{36})/)[1]
})

after(async () => {
  mock?.child.kill()
  await mock?.exited
  fakeSupabase.closeAllConnections()
  await new Promise(resolve => fakeSupabase.close(resolve))
})

beforeEach(() => { failCaptionInsert = false })

test('[mock] the test targets the fake server, never a real project', () => {
  assert.match(fakeUrl, /^http:\/\/127\.0\.0\.1:/)
  assert.ok(mock.output.text.includes(`Supabase project: ${new URL(fakeUrl).host}`))
  assert.match(mock.output.text, /\(publishable key\)/)
})

test('[mock] a mock-created image receives a clearly marked, unpublished caption', async () => {
  const imageId = await createMockImage()
  const image = images.get(imageId)
  assert.equal(image.url, `https://example.test/photo.jpg#mock-caption-api=${runId}`)
  assert.equal(image.profile_id, userA.id)
  assert.equal(image.is_common_use, false)
  assert.equal(image.is_public, false)

  image.additional_context = privateNudge
  const submitted = await call('/pipeline/generate-captions', { body: { imageId } })
  assert.equal(submitted.status, 202)
  const { jobId } = await submitted.json()
  const job = await (await call(`/pipeline/caption-job/${jobId}`, { method: 'GET' })).json()
  assert.equal(job.status, 'completed')

  const caption = captions.find(row => row.id === job.captionIds[0])
  assert.equal(caption.content, `MOCK caption using context: ${privateNudge}`)
  assert.equal(caption.image_id, imageId)
  assert.equal(caption.is_public, false)
  assert.equal(caption.profile_id, null, 'no owner keeps the app’s Post button hidden')
  assert.deepEqual(caption.metadata, { source: 'mock-caption-api', run_id: runId, synthetic: true })
})

test('[mock] a saved caption survives the job response and reaches the app with its text',
  async () => {
    const imageId = await createMockImage()
    images.get(imageId).additional_context = privateNudge
    const loaded = await runCaptionJob(imageId, {
      apiUrl: mock.base,
      getAuth: async () => ({ accessToken: userA.token, userId: userA.id }),
      loadCaptions: async ids => ids.map(id => captions.find(row => row.id === id)),
      wait: async () => {},
    })
    assert.equal(loaded.length, 1)
    assert.equal(loaded[0].content, `MOCK caption using context: ${privateNudge}`)
    assert.equal(loaded[0].image_id, imageId)
  })

const pngBytes = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex')
const put = (url, type = 'image/png', body = pngBytes) =>
  fetch(url, { method: 'PUT', headers: { 'Content-Type': type }, body })
const presign = async () =>
  (await call('/pipeline/generate-presigned-url', { body: { contentType: 'image/png' } })).json()

test('[mock] an uploaded file is served back byte for byte from the local server', async () => {
  const { presignedUrl, cdnUrl } = await presign()
  assert.ok(cdnUrl.startsWith(`${mock.base}/mock-upload/`), 'previews must stay on loopback')
  assert.equal((await put(presignedUrl)).status, 200)

  const response = await fetch(cdnUrl)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('content-type'), 'image/png')
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), pngBytes)
})

test('[mock] a saved mock image URL still loads the file with its marker attached', async () => {
  const { presignedUrl, cdnUrl } = await presign()
  await put(presignedUrl)
  const registered = await call('/pipeline/upload-image-from-url', {
    body: { imageUrl: cdnUrl, isCommonUse: false },
  })
  const { url } = images.get((await registered.json()).imageId)
  assert.equal(url, `${cdnUrl}#mock-caption-api=${runId}`)
  assert.deepEqual(Buffer.from(await (await fetch(url)).arrayBuffer()), pngBytes)
})

test('[mock] mock upload URLs have no extension, so grids skip thumbnail requests', async () => {
  const { cdnUrl } = await presign()
  const thumbnailPattern = /https?:\/\/[^\/]+\/([^\/]+)\/([^\/\?]+)\.([^\/\?\s]+)/
  assert.equal(`${cdnUrl}#mock-caption-api=${runId}`.match(thumbnailPattern), null)
})

test('[mock] only issued image uploads can be stored or read', async () => {
  const unknown = `${mock.base}/mock-upload/${randomUUID()}`
  assert.equal((await put(unknown)).status, 404)
  assert.equal((await fetch(unknown)).status, 404)

  const { presignedUrl } = await presign()
  assert.equal((await fetch(presignedUrl)).status, 404, 'nothing has been uploaded yet')
  for (const type of ['image/svg+xml', 'text/html', 'application/octet-stream']) {
    assert.equal((await put(presignedUrl, type, '<svg onload=alert(1)>')).status, 415)
  }
  assert.equal((await fetch(presignedUrl)).status, 404, 'refused files are not stored')
})

test('[mock] stored uploads are capped, and the oldest is dropped first', async () => {
  const { presignedUrl: oldest } = await presign()
  await put(oldest)
  for (let index = 0; index < 25; index++) await presign()
  assert.equal((await fetch(oldest)).status, 404)
})

test('[mock] an imported image owned by the signed-in user is rejected', async () => {
  await assertRejected(seedImage().id)
})

test('[mock] an imported image is rejected even with a copied run marker', async () => {
  const url = `https://images.example.test/imported.jpg#mock-caption-api=${runId}`
  await assertRejected(seedImage({ url }).id)
})

test('[mock] banger images are rejected', async () => {
  await assertRejected(seedImage({ is_common_use: true }).id)
  await assertRejected(seedImage({ is_common_use: true, profile_id: userB.id }).id)
})

test('[mock] an image belonging to another user is rejected', async () => {
  await assertRejected(seedImage({ profile_id: userB.id }).id)
  await assertRejected(seedImage({ profile_id: userB.id, is_public: true }).id)
})

test('[mock] one user cannot caption another user’s mock image', async () => {
  await assertRejected(await createMockImage(userA.token), userB.token)
})

test('[mock] a mock image is rejected if its row no longer qualifies', async () => {
  const changes = [
    { is_common_use: true },
    { is_common_use: null },
    { is_public: true },
    { profile_id: userB.id },
    { url: 'https://example.test/photo.jpg' },
  ]
  for (const change of changes) {
    const imageId = await createMockImage()
    Object.assign(images.get(imageId), change)
    await assertRejected(imageId)
  }
})

test('[mock] unknown and malformed image IDs are rejected', async () => {
  for (const imageId of [randomUUID(), 'not-a-uuid', null, undefined, 42]) {
    await assertRejected(imageId)
  }
})

test('[mock] shared uploads are refused before anything is written', async () => {
  const before = images.size
  const response = await call('/pipeline/upload-image-from-url', {
    body: { imageUrl: 'https://example.test/photo.jpg', isCommonUse: true },
  })
  assert.equal(response.status, 403)
  assert.equal(images.size, before)
})

test('[mock] requests without a valid JWT are refused', async () => {
  const before = images.size
  for (const token of [null, 'not-a-real-token', publicKey]) {
    const response = await call('/pipeline/upload-image-from-url', {
      token,
      body: { imageUrl: 'https://example.test/photo.jpg' },
    })
    assert.equal(response.status, 401)
  }
  assert.equal(images.size, before)
})

test('[mock] a job is visible only to the user who created it', async () => {
  const imageId = await createMockImage()
  const { jobId } = await (await call('/pipeline/generate-captions', { body: { imageId } })).json()
  const other = await call(`/pipeline/caption-job/${jobId}`, { method: 'GET', token: userB.token })
  assert.equal(other.status, 404)
})

test('[mock] the same idempotency key does not create a second caption', async () => {
  const imageId = await createMockImage()
  const key = randomUUID()
  const first = await (await call('/pipeline/generate-captions', { body: { imageId }, key })).json()
  const before = captions.length
  const again = await (await call('/pipeline/generate-captions', { body: { imageId }, key })).json()
  assert.equal(again.jobId, first.jobId)
  assert.equal(captions.length, before)
})

test('[mock] bad input returns a clear 400', async () => {
  const path = '/pipeline/upload-image-from-url'
  assert.equal((await call(path, { body: 'not json' })).status, 400)
  for (const imageUrl of ['nope', 'file:///etc/passwd', 42, undefined]) {
    assert.equal((await call(path, { body: { imageUrl } })).status, 400)
  }
})

test('[mock] database failures stay generic and keep row data out of responses', async () => {
  const imageId = await createMockImage()
  failCaptionInsert = true
  const response = await call('/pipeline/generate-captions', { body: { imageId } })
  assert.equal(response.status, 500)
  assert.deepEqual(await response.json(), { error: 'Caption insert failed.' })
  assert.match(mock.output.text, /Caption insert failed \(code 23514\)/)
})

test('[mock] the server is not reachable from other network interfaces', async t => {
  const external = Object.values(networkInterfaces()).flat()
    .find(address => address.family === 'IPv4' && !address.internal)
  if (!external) return t.skip('no external network interface')
  const refused = await new Promise(resolve => {
    const socket = connect(mock.port, external.address)
    socket.once('connect', () => { socket.destroy(); resolve(false) })
    socket.once('error', () => resolve(true))
  })
  assert.equal(refused, true)
})

test('[mock] an unreachable Supabase is reported as 503, not a bad login', async () => {
  const unreachable = await startMock({
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:9',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: publicKey,
  })
  try {
    const response = await fetch(`${unreachable.base}/pipeline/generate-presigned-url`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userA.token}` },
    })
    assert.equal(response.status, 503)
    assert.match(unreachable.output.text, /Supabase auth is unavailable/)
    assert.doesNotMatch(unreachable.output.text, new RegExp(userA.token))
  } finally {
    unreachable.child.kill()
    await unreachable.exited
  }
})

test('[mock] secret, unknown and missing keys stop startup without printing them', async () => {
  const jwt = role => `h.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.s`
  const keys = ['sb_secret_fake-value', jwt('service_role'), 'some-unknown-key', undefined]
  for (const key of keys) {
    const started = spawnMock({
      NEXT_PUBLIC_SUPABASE_URL: fakeUrl,
      ...(key ? { NEXT_PUBLIC_SUPABASE_ANON_KEY: key } : {}),
    })
    const timer = setTimeout(() => started.child.kill(), 3000)
    const code = await started.exited
    clearTimeout(timer)
    assert.equal(code, 1, 'the server must refuse to start')
    assert.match(started.output.text, /did not start/)
    if (key) assert.equal(started.output.text.includes(key), false)
  }
})

test('[mock] a legacy anon JWT is accepted as a public key', async () => {
  const anon = `h.${Buffer.from(JSON.stringify({ role: 'anon' })).toString('base64url')}.s`
  const started = await startMock({
    NEXT_PUBLIC_SUPABASE_URL: fakeUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anon,
  })
  assert.match(started.output.text, /\(anon key\)/)
  started.child.kill()
  await started.exited
})

// Keep this test last: it checks the traffic and logs from every test above.
test('[mock] the suite only read and inserted, and logged no tokens, keys or nudges', () => {
  const allowed = new Set([
    'GET /auth/v1/user',
    'GET /rest/v1/images',
    'POST /rest/v1/images',
    'POST /rest/v1/captions',
  ])
  assert.deepEqual([...new Set(traffic)].filter(request => !allowed.has(request)), [])
  for (const value of [userA.token, userB.token, publicKey, privateNudge]) {
    assert.equal(mock.output.text.includes(value), false)
  }
})

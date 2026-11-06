import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { runCaptionJob, CaptionJobRequestError } from '../src/utils/caption-job-client.ts'

function fixture(overrides = {}) {
  const imageId = randomUUID()
  const jobId = randomUUID()
  const captionId = randomUUID()
  const calls = []
  const updates = []
  const saved = new Map()
  const loads = []
  const auth = { userId: randomUUID(), accessToken: 'user-jwt' }
  const job = (status, extra = {}) => ({ jobId, status,
    progress: { total: 1, completed: status === 'completed' ? 1 : 0,
      failed: status === 'failed' ? 1 : 0, completedSteps: status === 'queued' ? 0 : 1,
      totalSteps: 1 }, captionIds: status === 'completed' ? [captionId] : [], ...extra })
  let responses = [job('queued'), job('running'), job('completed')]
  const options = {
    apiUrl: 'https://api.example.test/',
    storage: { getItem: key => saved.get(key) ?? null,
      setItem: (key, value) => saved.set(key, value), removeItem: key => saved.delete(key) },
    getAuth: async () => auth,
    loadCaptions: async (ids, current, signal) => {
      signal.throwIfAborted()
      loads.push({ ids, auth: current })
      return ids.map(id => ({ id, content: 'A test caption', image_id: imageId }))
    },
    onProgress: update => updates.push(update.status),
    wait: async (_ms, signal) => signal.throwIfAborted(),
    fetchImpl: async (url, init) => {
      calls.push({ url, ...init })
      if (init.method === 'POST') return Response.json({ jobId,
        statusUrl: 'https://untrusted.example/steal-token' }, { status: 202 })
      const next = responses.shift()
      if (next instanceof Error) throw next
      if (typeof next === 'number') return new Response('', { status: next })
      assert.ok(next, 'unexpected extra status request')
      return Response.json(next)
    },
    ...overrides,
  }
  return { imageId, jobId, captionId, job, options, calls, updates, saved, loads, auth,
    respond: next => { responses = next } }
}

test('202 submission is polled to completion and only saved caption IDs are loaded', async () => {
  const f = fixture()
  const result = await runCaptionJob(f.imageId, f.options)
  assert.equal(result[0].id, f.captionId)
  assert.deepEqual(f.updates, ['queued', 'queued', 'running', 'completed'])
  assert.equal(f.calls.length, 4)
  assert.equal(f.calls[0].url, 'https://api.example.test/pipeline/generate-captions')
  assert.deepEqual(JSON.parse(f.calls[0].body), { imageId: f.imageId })
  assert.ok(f.calls[0].headers['Idempotency-Key'])
  for (const call of f.calls.slice(1)) {
    assert.equal(call.url, `https://api.example.test/pipeline/caption-job/${f.jobId}`)
    assert.equal(call.headers.Authorization, 'Bearer user-jwt')
    assert.equal(call.cache, 'no-store')
  }
  assert.deepEqual(f.loads[0].ids, [f.captionId])
  assert.equal(f.loads.length, 1)
  assert.equal(f.saved.size, 0)
})

test('partial success returns successful captions and reports partial failure once', async () => {
  let warnings = 0
  const f = fixture({ onPartialFailure: () => warnings++ })
  f.respond([f.job('partially_completed', { captionIds: [f.captionId, f.captionId] })])
  const result = await runCaptionJob(f.imageId, f.options)
  assert.equal(result.length, 1)
  assert.equal(warnings, 1)
})

test('failed job is an error even though its status endpoint returned HTTP 200', async () => {
  const f = fixture()
  f.respond([f.job('failed')])
  await assert.rejects(runCaptionJob(f.imageId, f.options), /No captions could be generated/)
  assert.equal(f.loads.length, 0)
  assert.equal(f.saved.size, 0)
})

test('transient polling failures never submit another generation', async () => {
  const f = fixture()
  f.respond([429, 503, new TypeError('Offline'), f.job('completed')])
  await runCaptionJob(f.imageId, f.options)
  assert.equal(f.calls.filter(c => c.method === 'POST').length, 1)
})

test('an ambiguous submit retries with the same idempotency key', async () => {
  const f = fixture()
  const fetch = f.options.fetchImpl
  let submits = 0
  const keys = []
  f.options.fetchImpl = async (url, init) => {
    if (init.method === 'POST') {
      keys.push(init.headers['Idempotency-Key'])
      if (submits++ === 0) throw new TypeError('Response lost')
    }
    return fetch(url, init)
  }
  await runCaptionJob(f.imageId, f.options)
  assert.equal(submits, 2)
  assert.equal(keys[0], keys[1])
})

test('401 refreshes the user JWT and polls the existing job', async () => {
  const f = fixture()
  let authCalls = 0
  f.options.getAuth = async () => ({ ...f.auth, accessToken: authCalls++ ? 'fresh-jwt' : 'old-jwt' })
  f.respond([401, f.job('completed')])
  await runCaptionJob(f.imageId, f.options)
  assert.equal(authCalls, 2)
  assert.equal(f.calls.at(-1).headers.Authorization, 'Bearer fresh-jwt')
  assert.equal(f.loads[0].auth.accessToken, 'fresh-jwt')
})

test('auth refresh cannot continue a previous account’s job', async () => {
  const f = fixture()
  let authCalls = 0
  f.options.getAuth = async () => authCalls++ ? { ...f.auth, userId: randomUUID() } : f.auth
  f.respond([401])
  await assert.rejects(runCaptionJob(f.imageId, f.options), /account changed/)
  assert.equal(f.loads.length, 0)
})

test('stopping polling preserves the job and resuming does not POST again', async () => {
  const controller = new AbortController()
  const f = fixture({ signal: controller.signal })
  f.options.onProgress = update => { if (update.status === 'running') controller.abort() }
  await assert.rejects(runCaptionJob(f.imageId, f.options), { name: 'AbortError' })
  assert.equal(f.saved.size, 1)
  assert.equal(f.loads.length, 0)
  await runCaptionJob(f.imageId, { ...f.options, signal: undefined, onProgress: undefined })
  assert.equal(f.calls.filter(c => c.method === 'POST').length, 1)
})

test('a page reload resumes the stored job without persisting credentials', async () => {
  const f = fixture()
  const key = `caption-job:https://api.example.test:${f.auth.userId}:${f.imageId}`
  f.saved.set(key, JSON.stringify({ idempotencyKey: randomUUID(), jobId: f.jobId }))
  await runCaptionJob(f.imageId, f.options)
  assert.equal(f.calls.some(c => c.method === 'POST'), false)
})

test('canceling an ambiguous submission retains its key for the next attempt', async () => {
  const controller = new AbortController()
  const f = fixture({ signal: controller.signal })
  const fetch = f.options.fetchImpl
  let firstKey
  f.options.fetchImpl = async (_url, init) => {
    firstKey = init.headers['Idempotency-Key']
    controller.abort()
    throw controller.signal.reason
  }
  await assert.rejects(runCaptionJob(f.imageId, f.options), { name: 'AbortError' })
  await runCaptionJob(f.imageId, { ...f.options, signal: undefined, fetchImpl: fetch })
  assert.equal(f.calls[0].headers['Idempotency-Key'], firstKey)
})

test('failure loading captions resumes the completed job instead of regenerating it', async () => {
  const f = fixture()
  const load = f.options.loadCaptions
  f.options.loadCaptions = async () => { throw new Error('Database unavailable') }
  await assert.rejects(runCaptionJob(f.imageId, f.options), /Database unavailable/)
  assert.equal(f.saved.size, 1)
  f.respond([f.job('completed')])
  await runCaptionJob(f.imageId, { ...f.options, loadCaptions: load })
  assert.equal(f.calls.filter(c => c.method === 'POST').length, 1)
})

test('caption loading refreshes an expired JWT too', async () => {
  const f = fixture()
  const load = f.options.loadCaptions
  let calls = 0
  f.options.loadCaptions = async (...args) => {
    if (calls++ === 0) throw new CaptionJobRequestError(401, 'expired')
    return load(...args)
  }
  await runCaptionJob(f.imageId, f.options)
  assert.equal(calls, 2)
})

test('Crack Again after success creates a fresh generation', async () => {
  const f = fixture()
  await runCaptionJob(f.imageId, f.options)
  f.respond([f.job('completed')])
  await runCaptionJob(f.imageId, f.options)
  const submits = f.calls.filter(c => c.method === 'POST')
  assert.equal(submits.length, 2)
  assert.notEqual(submits[0].headers['Idempotency-Key'], submits[1].headers['Idempotency-Key'])
})

test('rejects malformed status and caption IDs without querying captions', async () => {
  for (const extra of [{ status: 'unknown' }, { progress: {} }, { captionIds: ['invalid'] }]) {
    const f = fixture()
    f.respond([f.job('completed', extra)])
    await assert.rejects(runCaptionJob(f.imageId, f.options), /status response was invalid/)
    assert.equal(f.loads.length, 0)
  }
})

test('already canceled operations never submit a job', async () => {
  const controller = new AbortController()
  controller.abort()
  const f = fixture({ signal: controller.signal })
  await assert.rejects(runCaptionJob(f.imageId, f.options), { name: 'AbortError' })
  assert.equal(f.calls.length, 0)
})

test('a waiting deadline preserves the job and explains that it still runs', async () => {
  const f = fixture({ timeoutMs: 20 })
  f.respond([f.job('running')])
  f.options.wait = async (_ms, signal) => {
    await new Promise(resolve => setTimeout(resolve, 30))
    signal.throwIfAborted()
  }
  await assert.rejects(runCaptionJob(f.imageId, f.options), /still processing/)
  assert.equal(f.saved.size, 1)
  f.respond([f.job('completed')])
  await runCaptionJob(f.imageId, { ...f.options, timeoutMs: 1000 })
  assert.equal(f.calls.filter(c => c.method === 'POST').length, 1)
})

test('a changed user never reuses another account’s job', async () => {
  const f = fixture()
  const controller = new AbortController()
  f.options.onProgress = () => controller.abort()
  await assert.rejects(runCaptionJob(f.imageId,
    { ...f.options, signal: controller.signal }), { name: 'AbortError' })
  f.respond([f.job('completed')])
  await runCaptionJob(f.imageId, { ...f.options, onProgress: undefined,
    getAuth: async () => ({ ...f.auth, userId: randomUUID() }) })
  const submits = f.calls.filter(c => c.method === 'POST')
  assert.equal(submits.length, 2)
  assert.notEqual(submits[0].headers['Idempotency-Key'], submits[1].headers['Idempotency-Key'])
})

// Browser orchestration: each HTTP request is short; waiting happens between requests.
export type CaptionJobStatus =
  | 'queued' | 'running' | 'completed' | 'partially_completed' | 'failed'

export type CaptionJobUpdate = {
  jobId: string
  status: CaptionJobStatus
  progress: { total: number; completed: number; failed: number;
    completedSteps: number; totalSteps: number }
  captionIds: string[]
}
export type CaptionGenerationOptions = {
  signal?: AbortSignal
  onProgress?: (job: CaptionJobUpdate) => void
  onPartialFailure?: () => void
}
export type CaptionAuth = { accessToken: string; userId: string }
type PendingJob = { idempotencyKey: string; jobId?: string }
type PendingStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
type ClientOptions<T> = CaptionGenerationOptions & {
  apiUrl: string
  getAuth: (signal: AbortSignal) => Promise<CaptionAuth>
  loadCaptions: (ids: string[], auth: CaptionAuth, signal: AbortSignal) => Promise<T[]>
  storage?: PendingStore
  fetchImpl?: typeof fetch
  wait?: (ms: number, signal: AbortSignal) => Promise<void>
  timeoutMs?: number
  pollIntervalMs?: number
}

export class CaptionJobRequestError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const uuid = (value: unknown): value is string => typeof value === 'string'
  && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
const pendingMemory = new Map<string, PendingJob>()
const terminal = new Set(['completed', 'partially_completed', 'failed'])

function waitForPoll(ms: number, signal: AbortSignal): Promise<void> {
  signal.throwIfAborted()
  return new Promise((resolve, reject) => {
    const cancel = () => { clearTimeout(timer); reject(signal.reason) }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', cancel)
      resolve()
    }, ms)
    signal.addEventListener('abort', cancel, { once: true })
  })
}

export async function runCaptionJob<T>(imageId: string, options: ClientOptions<T>): Promise<T[]> {
  if (!uuid(imageId)) throw new Error('Invalid image ID.')
  const { getAuth, loadCaptions, onProgress, onPartialFailure } = options
  const fetchImpl = options.fetchImpl ?? fetch
  const wait = options.wait ?? waitForPoll
  const apiUrl = options.apiUrl.replace(/\/+$/, '')
  const timeout = AbortSignal.timeout(options.timeoutMs ?? 60 * 60 * 1000)
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout
  const requestSignal = () => AbortSignal.any([signal, AbortSignal.timeout(30_000)])
  let auth = await getAuth(requestSignal())
  signal.throwIfAborted()
  const ownerId = auth.userId
  const key = `caption-job:${apiUrl}:${ownerId}:${imageId}`
  let storage = options.storage
  try { storage ??= typeof window === 'undefined' ? undefined : window.sessionStorage } catch {}
  let restored = pendingMemory.get(key)
  if (!restored) {
    try {
      const saved = JSON.parse(storage?.getItem(key) ?? 'null') as PendingJob | null
      if (saved && uuid(saved.idempotencyKey) && (!saved.jobId || uuid(saved.jobId))) {
        restored = saved
      }
    } catch { /* Storage is optional; the in-memory copy also supports retries. */ }
  }
  const pending: PendingJob = restored ?? { idempotencyKey: crypto.randomUUID() }
  const save = () => {
    pendingMemory.set(key, pending)
    try { storage?.setItem(key, JSON.stringify(pending)) } catch {}
  }
  const clear = () => {
    // A late response must not clear a newer generation's pending job.
    if (pendingMemory.get(key)?.idempotencyKey !== pending.idempotencyKey) return
    pendingMemory.delete(key)
    try { storage?.removeItem(key) } catch {}
  }
  save()

  async function authenticated<R>(request: (auth: CaptionAuth) => Promise<R>): Promise<R> {
    try { return await request(auth) } catch (error) {
      signal.throwIfAborted()
      if (!(error instanceof CaptionJobRequestError) || error.status !== 401) throw error
      auth = await getAuth(requestSignal())
      if (auth.userId !== ownerId) throw new Error('Your account changed. Please try again.')
      return request(auth)
    }
  }
  async function api(path: string, method: 'GET' | 'POST') {
    return authenticated(async ({ accessToken }) => {
      const response = await fetchImpl(`${apiUrl}${path}`, {
        method, cache: 'no-store', signal: requestSignal(),
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...(method === 'POST' ? {
            'Content-Type': 'application/json', 'Idempotency-Key': pending.idempotencyKey,
          } : {}),
        },
        ...(method === 'POST' ? { body: JSON.stringify({ imageId }) } : {}),
      })
      if (!response.ok) {
        await response.body?.cancel()
        throw new CaptionJobRequestError(response.status,
          response.status === 401 ? 'Please sign in again to generate captions.'
            : `Unable to ${method === 'POST' ? 'start' : 'check'} captions (${response.status}).`)
      }
      return response.json()
    })
  }
  const retryable = (error: unknown) => error instanceof TypeError
    || (error instanceof DOMException && error.name === 'TimeoutError')
    || (error instanceof CaptionJobRequestError && (error.status === 429 || error.status >= 500))

  try {
    if (!pending.jobId) {
      for (let attempt = 0; ; attempt++) {
        signal.throwIfAborted()
        try {
          const accepted = await api('/pipeline/generate-captions', 'POST')
          if (!uuid(accepted?.jobId)) throw new Error('The caption job response was invalid.')
          pending.jobId = accepted.jobId
          save()
          break
        } catch (error) {
          signal.throwIfAborted()
          if (!retryable(error) || attempt >= 2) {
            if (error instanceof CaptionJobRequestError && error.status < 500
              && error.status !== 429 && error.status !== 401) clear()
            throw error
          }
          await wait(1000 * (attempt + 1), signal)
        }
      }
    }
    const jobId = pending.jobId
    if (!jobId) throw new Error('The caption job response was invalid.')
    signal.throwIfAborted()
    onProgress?.({ jobId, status: 'queued', captionIds: [],
      progress: { total: 0, completed: 0, failed: 0, completedSteps: 0, totalSteps: 0 } })

    let job: CaptionJobUpdate
    for (;;) {
      signal.throwIfAborted()
      try {
        // Construct this locally. Never send the user's token to a returned arbitrary URL.
        job = await api(`/pipeline/caption-job/${encodeURIComponent(jobId)}`, 'GET')
        signal.throwIfAborted()
        if (job?.jobId !== jobId || !['queued', 'running', ...terminal].includes(job.status)
          || !Array.isArray(job.captionIds) || !job.captionIds.every(uuid)
          || !job.progress || ![
            job.progress.total, job.progress.completed, job.progress.failed,
            job.progress.completedSteps, job.progress.totalSteps,
          ].every(value => Number.isInteger(value) && value >= 0)) {
          throw new Error('The caption job status response was invalid.')
        }
        onProgress?.(job)
        if (terminal.has(job.status)) break
      } catch (error) {
        signal.throwIfAborted()
        if (error instanceof CaptionJobRequestError && error.status === 404) clear()
        if (!retryable(error)) throw error
      }
      await wait(options.pollIntervalMs ?? 3000, signal)
    }
    if (job.status === 'failed' || job.captionIds.length === 0) {
      clear()
      throw new Error('No captions could be generated for this image. Please try again.')
    }
    // Keep the job reference if loading its captions fails, so retry never reruns the pipeline.
    const captions = await authenticated(current =>
      loadCaptions([...new Set(job.captionIds)], current, requestSignal()))
    signal.throwIfAborted()
    clear()
    if (job.status === 'partially_completed') onPartialFailure?.()
    return captions
  } catch (error) {
    if (timeout.aborted && !options.signal?.aborted) {
      throw new Error('This is taking longer than expected. Your captions are still processing. '
        + 'Try this image again to resume waiting.')
    }
    throw error
  }
}

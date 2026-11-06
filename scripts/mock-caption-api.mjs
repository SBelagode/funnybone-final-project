// LOCAL DEVELOPMENT ONLY. This is not the course caption API and calls no AI model.
// It follows the request and response shapes in scripts/caption-job-client.test.mjs, and uses
// the signed-in user's JWT, so its reads and writes go through your project's real RLS.
// Each caption quotes images.additional_context, which proves what was saved before generation.
//
// Rows it creates are real and stay in your Supabase project until you delete them.
// Use made-up nudges only. Mock captions quote the nudge, and the restored database has no RLS
// on captions, so is_public: false does NOT make them private: the anon key can read them.
//
// It only captions images this running process created for the signed-in user. Each image must
// be in the in-memory list below, carry this run's URL marker, and still be owned, unshared and
// unpublished in the database. Restarting starts a new run, so older mock images are refused.
//
// Uploaded files are kept in this process's memory only, so they can be previewed locally.
// They are never written to disk or sent anywhere, and they disappear on restart.
//
// Run: node --env-file=.env.local scripts/mock-caption-api.mjs
import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const host = '127.0.0.1'
const source = 'mock-caption-api'
const maxBodyBytes = 20 * 1024 * 1024
const maxStoredUploads = 25
const uploadPath = '/mock-upload/'
// SVG and HTML are excluded because this server hands stored bytes back to the browser.
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'])
const port = Number(process.env.MOCK_CAPTION_API_PORT ?? 4010)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function refuseToStart(reason) {
  console.error(`Mock caption API did not start: ${reason}`)
  process.exit(1)
}

// Only public keys are accepted, so a misplaced secret can never bypass RLS through this script.
function publicKeyType(key) {
  if (key.startsWith('sb_publishable_')) return 'publishable'
  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString())
    return payload.role === 'anon' ? 'anon' : null
  } catch {
    return null
  }
}

if (!supabaseUrl || !supabaseKey) {
  refuseToStart('Supabase settings are missing. Run with --env-file=.env.local.')
}
const keyType = publicKeyType(supabaseKey)
if (!keyType) refuseToStart('NEXT_PUBLIC_SUPABASE_ANON_KEY is not a public Supabase key.')
if (!URL.canParse(supabaseUrl)) refuseToStart('NEXT_PUBLIC_SUPABASE_URL is not a valid URL.')
if (!Number.isInteger(port)) refuseToStart('MOCK_CAPTION_API_PORT is not a valid port.')

const runId = randomUUID()
const imageMarker = `#${source}=${runId}`
const createdImages = new Map()
const uploads = new Map()
const jobs = new Map()
const jobsByKey = new Map()
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Idempotency-Key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
}

// `message` goes to the browser. `logDetail` goes to this terminal and must stay free of row
// data, so database failures are logged by error code only.
class HttpError extends Error {
  constructor(status, message, logDetail = message) {
    super(message)
    this.status = status
    this.logDetail = logDetail
  }
}

const databaseError = (action, error) =>
  new HttpError(500, `${action} failed.`, `${action} failed (code ${error.code ?? 'unknown'})`)
const rejectedImage = reason =>
  new HttpError(403, 'The mock only captions images it created for you in this run.', reason)

function send(response, status, body) {
  response.writeHead(status, { ...cors, 'Content-Type': 'application/json' })
  response.end(body === undefined ? undefined : JSON.stringify(body))
}

async function readBody(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > maxBodyBytes) throw new HttpError(413, 'The request body is too large.')
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

async function readJson(request) {
  try {
    return JSON.parse((await readBody(request)).toString() || '{}')
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw new HttpError(400, 'The request body is not valid JSON.')
  }
}

function issueUpload() {
  const name = randomUUID()
  uploads.set(name, null)
  if (uploads.size > maxStoredUploads) uploads.delete(uploads.keys().next().value)
  return `http://${host}:${server.address().port}${uploadPath}${name}`
}

async function storeUpload(request, name) {
  if (!uploads.has(name)) throw new HttpError(404, 'Upload not found.')
  const contentType = request.headers['content-type']?.split(';')[0].trim().toLowerCase()
  if (!imageTypes.has(contentType)) throw new HttpError(415, 'Only image uploads are supported.')
  uploads.set(name, { contentType, bytes: await readBody(request) })
}

function sendUpload(response, name) {
  const upload = uploads.get(name)
  if (!upload) throw new HttpError(404, 'Upload not found.')
  response.writeHead(200, {
    ...cors,
    'Content-Type': upload.contentType,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  })
  response.end(upload.bytes)
}

async function authenticate(request) {
  const token = request.headers.authorization?.match(/^Bearer (.+)$/)?.[1]
  if (!token) throw new HttpError(401, 'A signed-in user is required.')
  const auth = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } }).auth
  const { data: { user }, error } = await auth.getUser(token)
  if (user) {
    return { user, db: createClient(supabaseUrl, supabaseKey, { accessToken: async () => token }) }
  }
  if (!error?.status || error.status >= 500) {
    throw new HttpError(503, 'Supabase could not be reached.',
      `Supabase auth is unavailable (${error?.name ?? 'unknown error'})`)
  }
  throw new HttpError(401, 'A signed-in user is required.', 'Supabase rejected the access token')
}

async function registerImage({ user, db }, { imageUrl, isCommonUse }) {
  if (isCommonUse) throw rejectedImage('Refused a shared image upload')
  if (typeof imageUrl !== 'string' || !URL.canParse(imageUrl)) {
    throw new HttpError(400, 'imageUrl must be a valid URL.')
  }
  const url = new URL(imageUrl)
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new HttpError(400, 'imageUrl must use http or https.')
  }
  url.hash = ''

  // images has no metadata column, and its client ID columns must match a real auth client.
  const { data, error } = await db.from('images')
    .insert({
      url: `${url}${imageMarker}`,
      profile_id: user.id,
      is_common_use: false,
      is_public: false,
    })
    .select('id')
    .single()
  if (error) throw databaseError('Image insert', error)
  createdImages.set(data.id, user.id)
  return data.id
}

async function loadMockImage({ user, db }, imageId) {
  if (createdImages.get(imageId) !== user.id) {
    throw rejectedImage('Refused an image this run did not create for this user')
  }
  const { data: image, error } = await db.from('images')
    .select('url, additional_context, profile_id, is_common_use, is_public')
    .eq('id', imageId)
    .maybeSingle()
  if (error) throw databaseError('Image read', error)
  if (!image?.url?.endsWith(imageMarker)) throw rejectedImage('Refused an unmarked image')
  if (image.profile_id !== user.id) throw rejectedImage('Refused an image with another owner')
  if (image.is_common_use !== false) throw rejectedImage('Refused a shared image')
  if (image.is_public !== false) throw rejectedImage('Refused a public image')
  return image
}

async function createJob(session, imageId) {
  const { additional_context: context } = await loadMockImage(session, imageId)
  const { data: caption, error } = await session.db.from('captions')
    .insert({
      image_id: imageId,
      // No owner means the app hides its Post button. created_by_user_id still records the user.
      profile_id: null,
      is_public: false,
      content: context ? `MOCK caption using context: ${context}` : 'MOCK caption, no context',
      metadata: { source, run_id: runId, synthetic: true },
    })
    .select('id')
    .single()
  if (error) throw databaseError('Caption insert', error)

  const jobId = randomUUID()
  jobs.set(jobId, {
    ownerId: session.user.id,
    job: {
      jobId,
      status: 'completed',
      progress: { total: 1, completed: 1, failed: 0, completedSteps: 1, totalSteps: 1 },
      captionIds: [caption.id],
    },
  })
  return jobId
}

async function route(request, response, pathname) {
  if (request.method === 'OPTIONS') return send(response, 204)
  if (pathname.startsWith(uploadPath)) {
    const name = pathname.slice(uploadPath.length)
    if (request.method === 'GET') return sendUpload(response, name)
    if (request.method === 'PUT') {
      await storeUpload(request, name)
      return send(response, 200, {})
    }
  }

  const session = await authenticate(request)

  if (request.method === 'GET' && pathname.startsWith('/pipeline/caption-job/')) {
    const saved = jobs.get(pathname.split('/').pop())
    if (saved?.ownerId !== session.user.id) throw new HttpError(404, 'Job not found.')
    return send(response, 200, saved.job)
  }
  if (request.method !== 'POST') throw new HttpError(404, 'Not found.')

  const body = await readJson(request)
  if (pathname === '/pipeline/generate-presigned-url') {
    // No file extension: OptimizedImageGrid would otherwise request thumbnails that don't exist.
    const url = issueUpload()
    return send(response, 200, { presignedUrl: url, cdnUrl: url })
  }
  if (pathname === '/pipeline/upload-image-from-url') {
    return send(response, 200, { imageId: await registerImage(session, body) })
  }
  if (pathname === '/pipeline/generate-captions') {
    const key = `${session.user.id}:${request.headers['idempotency-key']}`
    if (!jobsByKey.has(key)) jobsByKey.set(key, await createJob(session, body.imageId))
    return send(response, 202, { jobId: jobsByKey.get(key) })
  }
  throw new HttpError(404, 'Not found.')
}

const server = createServer(async (request, response) => {
  const pathname = (request.url ?? '').split('?')[0]
  try {
    await route(request, response, pathname)
  } catch (error) {
    const known = error instanceof HttpError
    const status = known ? error.status : 500
    console.error(`${request.method} ${pathname} -> ${status}: `
      + (known ? error.logDetail : `unexpected ${error.name}`))
    send(response, status, { error: known ? error.message : 'The mock caption API failed.' })
  }
})

server.on('error', error => refuseToStart(`could not listen on ${host}:${port} (${error.code}).`))
server.listen(port, host, () => {
  console.log(`MOCK caption API listening on http://${host}:${server.address().port}`)
  console.log(`Supabase project: ${new URL(supabaseUrl).host} (${keyType} key)`)
  console.log(`Mock run: ${runId}. No AI. Rows it creates persist. Use made-up nudges only.`)
})

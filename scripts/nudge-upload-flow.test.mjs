// Mock tests: the caption API and server actions are stubbed. No request leaves this process.
// The component tests run the real generate-roasts.tsx and the real upload flow, choosing an
// image first and then clicking Generate, as users do.
import { afterEach, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import * as uploadFlow from '../src/utils/nudge-upload-flow.ts'
import { trackObjectUrls } from './support/render-component.mjs'
import { cdnUrl, imageId, photo, renderGenerateRoasts } from './support/generate-roasts-fixture.mjs'

const { generateAfterSavingNudge, prepareNudgeForUpload } = uploadFlow
const link = 'https://example.test/photo.png'
let urls
let view

beforeEach(() => { urls = trackObjectUrls() })
afterEach(() => {
  view?.unmount()
  view = undefined
  urls.restore()
})

const paths = {
  'file picker': {
    choose: async v => { v.selectFile(photo()); await v.settle() },
    upload: ['presign', 'put:photo.png', `register:${cdnUrl}`],
  },
  'drag and drop': {
    choose: async v => { v.dropFile(photo()); await v.settle() },
    upload: ['presign', 'put:photo.png', `register:${cdnUrl}`],
  },
  'image URL': {
    choose: v => v.enterUrl(link),
    upload: [`register:${link}`],
  },
}

async function generateWith(path, nudge, options) {
  view = renderGenerateRoasts(options)
  await view.settle()
  view.typeNudge(nudge)
  await paths[path].choose(view)
  await view.clickGenerate()
  await view.settle()
  return view
}

for (const [name, { upload }] of Object.entries(paths)) {
  test(`[mock] ${name}: the nudge is saved after upload and before generation`, async () => {
    const v = await generateWith(name, '  Midterm average was 42%.  ')
    assert.deepEqual(v.log, ['availability', 'begin', ...upload,
      'save:Midterm average was 42%.', `generate:${imageId}`, 'complete'])
    assert.deepEqual(v.toasts, [])
  })

  test(`[mock] ${name}: a failed save stops generation and explains why`, async () => {
    const error = 'We couldn’t find this image on your account.'
    const v = await generateWith(name, 'A nudge', { save: () => ({ ok: false, error }) })
    assert.ok(v.log.includes('fail'))
    assert.equal(v.log.some(entry => entry.startsWith('generate')), false)
    assert.equal(v.hasText('Your image is ready'), false, 'Get captions must stay hidden')
    assert.equal(v.toasts.at(-1).description, error)
  })

  test(`[mock] ${name}: a save request that throws also stops generation`, async () => {
    const v = await generateWith(name, 'A nudge', {
      save: () => { throw new Error('network down') },
    })
    assert.equal(v.log.some(entry => entry.startsWith('generate')), false)
    assert.equal(v.toasts.at(-1).description, uploadFlow.NUDGE_SAVE_FAILED_ERROR)
  })

  test(`[mock] ${name}: a blank nudge keeps the original flow with no nudge calls`, async () => {
    const v = await generateWith(name, '', { available: false })
    assert.deepEqual(v.log, ['begin', ...upload, `generate:${imageId}`, 'complete'])
    assert.deepEqual(v.toasts, [])
  })

  test(`[mock] ${name}: a disabled flag blocks everything and says so`, async () => {
    const v = await generateWith(name, 'A nudge', { available: false })
    assert.deepEqual(v.log, ['availability'])
    assert.equal(v.toasts.at(-1).description, uploadFlow.NUDGE_UNAVAILABLE_ERROR)
  })

  test(`[mock] ${name}: a failed availability check fails closed`, async () => {
    const v = await generateWith(name, 'A nudge', { available: new Error('network down') })
    assert.deepEqual(v.log, ['availability'])
    assert.equal(v.toasts.at(-1).description, uploadFlow.NUDGE_CHECK_FAILED_ERROR)
  })

  test(`[mock] ${name}: an invalid nudge stops before any request`, async () => {
    const v = await generateWith(name, '${step1Output}')
    assert.deepEqual(v.log, [])
    assert.match(v.toasts.at(-1).description, /\$\{/)
  })
}

test('[mock] selecting a banger ignores a typed nudge and keeps its redirect', async () => {
  const bangerId = randomUUID()
  view = renderGenerateRoasts({ bangers: [{ id: bangerId, url: link }] })
  await view.settle()
  view.typeNudge('A nudge')
  await view.settle()
  await view.find(node => node.type === view.ui.OptimizedImageGrid).props.onSelect(bangerId, link)
  assert.deepEqual(view.routes, [`/image/${bangerId}/captions`])
  assert.deepEqual(view.log, [])
})

test('[mock] an abort during the save prevents generation', async () => {
  const controller = new AbortController()
  const steps = []
  await assert.rejects(generateAfterSavingNudge({
    imageId,
    nudge: 'A nudge',
    signal: controller.signal,
    saveNudge: async () => {
      controller.abort(new Error('canceled'))
      return { ok: true }
    },
    onImageReady: () => steps.push('ready'),
    generate: async () => steps.push('generate'),
  }), /canceled/)
  assert.deepEqual(steps, [])
})

test('[mock] preparing a blank or invalid nudge never checks availability', async () => {
  const unexpected = async () => assert.fail('availability should not be checked')
  const blank = { ok: true, nudge: null }
  const invalid = { ok: false, error: 'Nope' }
  assert.deepEqual(await prepareNudgeForUpload(blank, unexpected), blank)
  assert.deepEqual(await prepareNudgeForUpload(invalid, unexpected), invalid)
})

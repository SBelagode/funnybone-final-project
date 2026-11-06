// Mock tests: the caption API and server actions are stubbed. No request leaves this process.
// The handler tests still run the real generate-roasts.tsx and the real upload flow.
import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'
import * as imageNudge from '../src/utils/image-nudge.ts'
import * as uploadFlow from '../src/utils/nudge-upload-flow.ts'

const { generateAfterSavingNudge, prepareNudgeForUpload } = uploadFlow
const require = createRequire(import.meta.url)
const { outputText } = ts.transpileModule(readFileSync(new URL(
  '../src/components/generate-roasts.tsx', import.meta.url,
), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX },
})

const imageId = randomUUID()
const imageUrl = 'https://example.test/photo.png'
const file = { name: 'photo.png', type: 'image/png' }
const caption = { id: randomUUID(), image_id: imageId, content: 'Mock caption' }

// useState slots in generate-roasts.tsx, in declaration order.
const state = { imageUrl: 0, nudge: 1, imageId: 2, imagePreview: 4, commonUseImages: 7 }

function loadComponent({ nudge = '', available = true, save, states = {},
  props = { redirectOnSelect: true } } = {}) {
  const log = []
  const toasts = []
  const routes = []
  let slot = 0
  const seeded = { [state.imageUrl]: imageUrl, [state.nudge]: nudge, ...states }
  const FileUpload = () => null
  const UrlInputModal = () => null
  const OptimizedImageGrid = () => null
  const element = (type, elementProps) => ({ type, props: elementProps })
  const mocks = {
    react: {
      useCallback: callback => callback,
      useEffect: () => {},
      useState(initial) {
        const index = slot++
        const setter = () => {
          if (index === state.imageId || index === state.imagePreview) log.push('image-ready')
        }
        return [index in seeded ? seeded[index] : initial, setter]
      },
    },
    'react/jsx-runtime': { Fragment: 'fragment', jsx: element, jsxs: element },
    'next/navigation': { useRouter: () => ({ push: path => routes.push(path) }) },
    '@/hooks/use-toast': { useToast: () => ({ toast: value => toasts.push(value) }) },
    '@/hooks/useCaptionGeneration': {
      useCaptionGeneration: () => ({
        isLoading: false,
        progress: null,
        begin() {
          log.push('begin')
          return {
            signal: new AbortController().signal,
            isCurrent: () => true,
            onProgress() {},
            complete: () => log.push('complete'),
            fail: () => log.push('fail'),
            finish() {},
          }
        },
      }),
    },
    '@/app/actions/captions': {
      fetchPopularCaptionsByImageIdAction: async () => [],
      generateCaptions: async id => {
        log.push(`generate:${id}`)
        return [caption]
      },
      generatePresignedUrl: async () => {
        log.push('presign')
        return { presignedUrl: 'https://example.test/put', cdnUrl: imageUrl }
      },
      uploadImageFromUrl: async () => {
        log.push('register')
        return imageId
      },
    },
    '@/app/actions/images': {
      fetchCommonUseCategoriesAction: async () => [],
      fetchCommonUseImagesAction: async () => ({ images: [], totalCount: 0 }),
      fetchImagesWithCaptionsAction: async () => [],
      getNudgeAvailabilityAction: async () => {
        log.push('availability')
        if (available instanceof Error) throw available
        return available
      },
      updateImageNudgeAction: async (id, text) => {
        log.push(`save:${id}:${text}`)
        return save ? save() : { ok: true }
      },
    },
    '@/components/ui/file-upload': { FileUpload },
    '@/components/ui/url-input-modal': { UrlInputModal },
    '@/components/OptimizedImageGrid': { OptimizedImageGrid },
    '@/utils/image-nudge': imageNudge,
    '@/utils/nudge-upload-flow': uploadFlow,
    '@/utils/upload-image-signed-url': {
      uploadImageViaSignedUrl: async () => log.push('put'),
    },
    '@/utils/valid-extension': {
      hasValidImageExtension: () => true,
      validExtensions: new Set(['.png']),
    },
  }
  const exports = {}
  const stub = new Proxy({}, { get: () => () => null })
  new Function('require', 'exports', outputText)(name => {
    if (name in mocks) return mocks[name]
    return name.startsWith('@/') ? stub : require(name)
  }, exports)
  const tree = exports.GenerateRoasts(props)

  const find = matches => {
    const pending = [tree]
    while (pending.length) {
      const node = pending.pop()
      if (Array.isArray(node)) pending.push(...node)
      else if (node?.props) {
        if (matches(node)) return node
        pending.push(node.props.children)
      }
    }
    throw new Error('element not found')
  }
  return { FileUpload, OptimizedImageGrid, UrlInputModal, find, log, routes, toasts }
}

// Each entry drives one real upload path through the rendered element's own handler.
const paths = {
  'file picker': async view => view.find(n => n.type === view.FileUpload).props.onChange([file]),
  'drag and drop': async view => {
    view.find(n => n.props.onDrop).props.onDrop({
      preventDefault() {},
      dataTransfer: { files: [file] },
    })
    await new Promise(resolve => setTimeout(resolve, 5))
  },
  'image URL': async view => view.find(n => n.type === view.UrlInputModal).props.onSubmit(imageUrl),
}
const uploadSteps = {
  'file picker': ['begin', 'presign', 'put', 'register'],
  'drag and drop': ['begin', 'presign', 'put', 'register'],
  'image URL': ['begin', 'register'],
}

for (const [name, upload] of Object.entries(paths)) {
  test(`[mock] ${name}: the nudge is saved after upload and before generation`, async () => {
    const view = loadComponent({ nudge: '  Midterm average was 42%.  ' })
    await upload(view)
    assert.deepEqual(view.log, [
      'availability',
      ...uploadSteps[name],
      `save:${imageId}:Midterm average was 42%.`,
      'image-ready',
      'image-ready',
      `generate:${imageId}`,
      'complete',
    ])
    assert.deepEqual(view.toasts, [])
  })

  test(`[mock] ${name}: a failed save stops generation and explains why`, async () => {
    const error = 'We couldn’t find this image on your account.'
    const view = loadComponent({ nudge: 'A nudge', save: () => ({ ok: false, error }) })
    await upload(view)
    assert.ok(view.log.includes('fail'))
    assert.equal(view.log.some(entry => entry.startsWith('generate')), false)
    assert.equal(view.log.includes('image-ready'), false, 'Get captions must stay hidden')
    assert.equal(view.toasts.at(-1).description, error)
  })

  test(`[mock] ${name}: a save request that throws also stops generation`, async () => {
    const view = loadComponent({
      nudge: 'A nudge',
      save: () => { throw new Error('network down') },
    })
    await upload(view)
    assert.equal(view.log.some(entry => entry.startsWith('generate')), false)
    assert.equal(view.toasts.at(-1).description, uploadFlow.NUDGE_SAVE_FAILED_ERROR)
  })

  test(`[mock] ${name}: a blank nudge keeps the original flow with no nudge calls`, async () => {
    for (const nudge of ['', '   \n ']) {
      const view = loadComponent({ nudge, available: false })
      await upload(view)
      assert.deepEqual(view.log, [
        ...uploadSteps[name],
        'image-ready',
        'image-ready',
        `generate:${imageId}`,
        'complete',
      ])
      assert.deepEqual(view.toasts, [])
    }
  })

  test(`[mock] ${name}: a disabled flag blocks everything and says so`, async () => {
    const view = loadComponent({ nudge: 'A nudge', available: false })
    await upload(view)
    assert.deepEqual(view.log, ['availability'])
    assert.equal(view.toasts.at(-1).description, uploadFlow.NUDGE_UNAVAILABLE_ERROR)
  })

  test(`[mock] ${name}: a failed availability check fails closed`, async () => {
    const view = loadComponent({ nudge: 'A nudge', available: new Error('network down') })
    await upload(view)
    assert.deepEqual(view.log, ['availability'])
    assert.equal(view.toasts.at(-1).description, uploadFlow.NUDGE_CHECK_FAILED_ERROR)
  })

  test(`[mock] ${name}: an invalid nudge stops before any request`, async () => {
    const view = loadComponent({ nudge: '${step1Output}' })
    await upload(view)
    assert.deepEqual(view.log, [])
    assert.match(view.toasts.at(-1).description, /\$\{/)
  })
}

test('[mock] selecting a banger ignores a typed nudge and keeps its redirect', async () => {
  const bangerId = randomUUID()
  const view = loadComponent({
    nudge: 'A nudge',
    states: { [state.commonUseImages]: [{ id: bangerId, url: imageUrl }] },
  })
  await view.find(n => n.type === view.OptimizedImageGrid).props.onSelect(bangerId, imageUrl)
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

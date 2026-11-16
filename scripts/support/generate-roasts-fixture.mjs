// Mock fixture for the real GenerateRoasts component. Server actions, the caption API, toasts and
// navigation are stubbed; nudge validation, the save-then-generate flow, file checks and the
// Crack Again refinement hook are real. `server` stands in for the image row and the API state.
import { randomUUID } from 'node:crypto'
import { loadModule, mount, textOf } from './render-component.mjs'
import * as imageNudge from '../../src/utils/image-nudge.ts'
import * as uploadFlow from '../../src/utils/nudge-upload-flow.ts'
import * as validExtension from '../../src/utils/valid-extension.ts'

// Loaded through the transpiler because it imports with the @/ alias.
export const contextRefinement = loadModule('utils/context-refinement.ts',
  { '@/utils/image-nudge': imageNudge })

export const imageId = randomUUID()
export const cdnUrl = 'https://example.test/uploads/photo.png'
export const photo = (name = 'photo.png', type = 'image/png') => ({ name, type })

export function deferred() {
  let resolve
  const promise = new Promise(done => { resolve = done })
  return { promise, resolve }
}

const component = name => Object.defineProperty(() => null, 'name', { value: name })

export function renderGenerateRoasts({
  available = true, save, bangers = [], hold = {}, generate, contextInfo, saveContext,
  refinement = true,
} = {}) {
  const log = []
  // The simulated image row and caption API. Tests may change these between steps.
  const server = { context: null, refinement, activeJob: false, writes: [] }
  const generations = []
  const toasts = []
  const routes = []
  const begun = []
  const caption = { id: randomUUID(), image_id: imageId, content: 'Mock caption',
    is_public: false, profile_id: 'user-1' }
  const toast = value => toasts.push(value)
  const router = { push: path => routes.push(path) }
  const ui = {
    Button: component('Button'),
    Textarea: component('Textarea'),
    FileUpload: component('FileUpload'),
    UrlInputModal: component('UrlInputModal'),
    OptimizedImageGrid: component('OptimizedImageGrid'),
    LoadingScreen: component('LoadingScreen'),
    CaptionViewV2: component('CaptionViewV2'),
  }
  let active = null
  let refinementModule
  // The refinement hook must share the component's React runtime and the same mocked actions.
  const withRefinement = (react, mocks) => {
    refinementModule = loadModule('components/context-refinement.tsx', {
      react, '@/utils/context-refinement': contextRefinement, ...mocks,
    })
    return { ...mocks, '@/components/context-refinement': refinementModule }
  }

  const view = mount('components/generate-roasts.tsx', 'GenerateRoasts',
    { redirectOnSelect: true }, react => withRefinement(react, {
      'next/navigation': { useRouter: () => router },
      '@/hooks/use-toast': { useToast: () => ({ toast }) },
      '@/hooks/useCaptionGeneration': {
        useCaptionGeneration() {
          const [isLoading, setIsLoading] = react.useState(false)
          return {
            isLoading,
            progress: null,
            begin(image) {
              if (active) log.push('cancelled-previous')
              log.push('begin')
              begun.push(image)
              const operation = {
                signal: new AbortController().signal,
                isCurrent: () => active === operation,
                onProgress() {},
                complete: () => log.push('complete'),
                fail: () => log.push('fail'),
                finish() {
                  if (active !== operation) return
                  active = null
                  setIsLoading(false)
                },
              }
              active = operation
              setIsLoading(true)
              return operation
            },
            continueBrowsing() {
              log.push('continue-browsing')
              active = null
              setIsLoading(false)
            },
          }
        },
      },
      '@/app/actions/captions': {
        fetchPopularCaptionsByImageIdAction: async () => [],
        generatePresignedUrl: async () => {
          log.push('presign')
          return { presignedUrl: 'https://example.test/put', cdnUrl }
        },
        uploadImageFromUrl: async url => {
          log.push(`register:${url}`)
          await hold.register
          return imageId
        },
        generateCaptions: async (id, options = {}) => {
          log.push(`generate:${id}`)
          generations.push({ id, snapshot: options.contextSnapshot })
          await hold.generate
          if (generate) return generate(generations.length, options)
          if (generations.length === 1) return [caption]
          return [{ ...caption, id: randomUUID(), content: `Mock caption ${generations.length}` }]
        },
      },
      '@/app/actions/images': {
        fetchCommonUseCategoriesAction: async () => [],
        fetchCommonUseImagesAction: async () => ({ images: bangers, totalCount: bangers.length }),
        fetchImagesWithCaptionsAction: async () => [],
        getNudgeAvailabilityAction: async () => {
          log.push('availability')
          await hold.availability
          if (available instanceof Error) throw available
          return available
        },
        updateImageNudgeAction: async (id, text) => {
          log.push(`save:${text}`)
          const result = save ? save() : { ok: true }
          if (result.ok) server.context = text
          return result
        },
        getImageContextAction: async () => {
          log.push('context-info')
          await hold.contextInfo
          if (contextInfo) return contextInfo()
          return { ok: true, context: server.context, refinement: server.refinement,
            activeJob: server.activeJob, notice: server.refinement ? null : 'Keep only.' }
        },
        // Mirrors the server action's rules with the real combineContext.
        updateImageContextAction: async (id, request) => {
          log.push(`context-save:${request.mode}`)
          await hold.saveContext
          if (saveContext) return saveContext(request)
          if (request.expected !== server.context) {
            return { ok: false, code: 'conflict', error: 'Changed elsewhere.',
              current: server.context }
          }
          if (server.activeJob) return { ok: false, code: 'busy', error: 'Still running.' }
          const result = contextRefinement.combineContext(server.context, request.mode,
            request.text)
          if (!result.ok) return { ok: false, code: 'invalid', error: result.error }
          if (result.context !== server.context) {
            server.writes.push(result.context)
            server.context = result.context
          }
          return { ok: true, context: result.context }
        },
      },
      '@/app/actions/auth/check-auth-status': {
        checkAuthStatusAction: async () => ({ userId: 'user-1' }),
      },
      '@/utils/saved-caption-ids': { loadSavedCaptionIds: async () => [] },
      '@/utils/upload-image-signed-url': {
        uploadImageViaSignedUrl: async file => { log.push(`put:${file.name}`) },
      },
      '@/utils/image-nudge': imageNudge,
      '@/utils/nudge-upload-flow': uploadFlow,
      '@/utils/valid-extension': validExtension,
      '@/components/ui/button': { Button: ui.Button },
      '@/components/ui/textarea': { Textarea: ui.Textarea },
      '@/components/ui/file-upload': { FileUpload: ui.FileUpload },
      '@/components/ui/url-input-modal': { UrlInputModal: ui.UrlInputModal },
      '@/components/OptimizedImageGrid': { OptimizedImageGrid: ui.OptimizedImageGrid },
      '@/components/LoadingScreen': { __esModule: true, default: ui.LoadingScreen },
      '@/components/ui/caption-view-v2': { CaptionViewV2: ui.CaptionViewV2 },
    }))

  const generateButton = () => view.find(node => node.type === ui.Button
    && /Generate Captions|Starting…/.test(textOf(node)))

  const panel = () => view.query(node => node.type === refinementModule.ContextRefinementPanel)
  return {
    ...view,
    ui,
    log,
    server,
    generations,
    panel,
    panelProps: () => panel()?.props ?? null,
    PanelComponent: () => refinementModule.ContextRefinementPanel,
    async crackAgain() {
      view.find(node => node.type === 'button' && textOf(node).includes('Crack Again'))
        .props.onClick()
      await view.settle()
    },
    shownCaptions: () => {
      const result = view.query(node => node.type === ui.CaptionViewV2)
      return result ? { content: result.props.content, index: result.props.currentIndex,
        total: result.props.totalCount } : null
    },
    toasts,
    routes,
    begun,
    caption,
    // Network activity only: loading the page's image lists is not generation.
    requests: () => log.filter(entry => !['complete', 'fail'].includes(entry)),
    selectFile: file => view.find(node => node.type === ui.FileUpload).props.onChange([file]),
    dropFile: file => view.find(node => node.props.onDrop).props.onDrop({
      preventDefault() {},
      dataTransfer: { files: [file] },
    }),
    async enterUrl(url) {
      view.find(node => node.type === ui.UrlInputModal).props.setCurrentUrl(url)
      await view.settle()
      view.find(node => node.type === ui.UrlInputModal).props.onSubmit(url)
      await view.settle()
    },
    typeNudge: value => view.find(node => node.props.id === 'caption-nudge')
      .props.onChange({ target: { value } }),
    nudgeValue: () => view.find(node => node.props.id === 'caption-nudge').props.value,
    generateButton,
    clickGenerate: () => generateButton().props.onClick(),
    clickButton: label => view.find(node => node.type === ui.Button
      && textOf(node) === label).props.onClick(),
    preview: () => view.query(node => node.type === 'img'
      && node.props.alt === 'Selected image preview'),
    hasText: text => view.query(node => typeof node.props.children === 'string'
      && node.props.children.includes(text)) !== null,
  }
}

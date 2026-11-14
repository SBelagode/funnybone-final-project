// Mock fixture for the real GenerateRoasts component. Server actions, the caption API, toasts and
// navigation are stubbed; nudge validation, the save-then-generate flow and file checks are real.
import { randomUUID } from 'node:crypto'
import { mount, textOf } from './render-component.mjs'
import * as imageNudge from '../../src/utils/image-nudge.ts'
import * as uploadFlow from '../../src/utils/nudge-upload-flow.ts'
import * as validExtension from '../../src/utils/valid-extension.ts'

export const imageId = randomUUID()
export const cdnUrl = 'https://example.test/uploads/photo.png'
export const photo = (name = 'photo.png', type = 'image/png') => ({ name, type })

export function deferred() {
  let resolve
  const promise = new Promise(done => { resolve = done })
  return { promise, resolve }
}

const component = name => Object.defineProperty(() => null, 'name', { value: name })

export function renderGenerateRoasts({ available = true, save, bangers = [], hold = {} } = {}) {
  const log = []
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

  const view = mount('components/generate-roasts.tsx', 'GenerateRoasts',
    { redirectOnSelect: true }, react => ({
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
        generateCaptions: async id => {
          log.push(`generate:${id}`)
          return [caption]
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
          return save ? save() : { ok: true }
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

  return {
    ...view,
    ui,
    log,
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

// Mock tests: React and app boundaries are stubbed, so these check what each page passes to
// CaptionViewV2. Captions on a page background must follow the theme, or light mode hides them.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'
import * as imageNudge from '../src/utils/image-nudge.ts'

const require = createRequire(import.meta.url)
const caption = {
  id: 'caption-id',
  image_id: 'image-id',
  content: 'MOCK caption, no context',
  is_public: false,
  profile_id: null,
}

function render(path, exportName, props, seeded = {}) {
  const source = readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX },
  })
  let slot = 0
  const element = (type, elementProps) => ({ type, props: elementProps })
  const CaptionViewV2 = () => null
  const mocks = {
    react: {
      useCallback: callback => callback,
      useEffect: () => {},
      useState(initial) {
        const index = slot++
        return [index in seeded ? seeded[index] : initial, () => {}]
      },
    },
    'react/jsx-runtime': { Fragment: 'fragment', jsx: element, jsxs: element },
    'next/navigation': { useRouter: () => ({ push() {} }) },
    'react-icons/fa6': { FaArrowLeft: () => null, FaArrowRight: () => null },
    '@/hooks/use-toast': { useToast: () => ({ toast() {} }) },
    '@/hooks/useCaptionGeneration': {
      useCaptionGeneration: () => ({ isLoading: false, progress: null }),
    },
    '@/components/ui/caption-view-v2': { CaptionViewV2 },
    '@/utils/image-nudge': imageNudge,
  }
  const stub = new Proxy({}, { get: () => () => null })
  const exports = {}
  new Function('require', 'exports', outputText)(name => {
    if (name in mocks) return mocks[name]
    return name.startsWith('@/') ? stub : require(name)
  }, exports)
  return { CaptionViewV2, tree: exports[exportName](props) }
}

function find(tree, matches) {
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

test('[mock] /new shows captions in the theme’s text color', () => {
  // Slots in generate-roasts.tsx: 3 is roasts, 4 is imagePreview.
  const { CaptionViewV2, tree } = render('components/generate-roasts.tsx', 'GenerateRoasts', {
    redirectOnSelect: true,
  }, { 3: [caption], 4: 'http://127.0.0.1:4010/mock-upload/image' })
  const view = find(tree, node => node.type === CaptionViewV2)
  assert.equal(view.props.tone, 'auto')
  assert.equal(view.props.content, caption.content)
  assert.equal(view.props.imageUrl, 'http://127.0.0.1:4010/mock-upload/image')
})

test('[mock] the image page shows captions in the theme’s text color', () => {
  const { CaptionViewV2, tree } = render(
    'app/image/[imageId]/captions/image-captions-page-client.tsx',
    'ImageCaptionsPageClient',
    { imageId: 'image-id', imageUrl: '/image.png', isCommonUse: false, initialCaptions: [caption] },
  )
  assert.equal(find(tree, node => node.type === CaptionViewV2).props.tone, 'auto')
})

const captionText = tone => {
  const { tree } = render('components/ui/caption-view-v2.tsx', 'CaptionViewV2', {
    id: caption.id,
    imageUrl: '/image.png',
    content: caption.content,
    saved: false,
    onSave() {},
    shareUrl: '/share',
    isPublic: false,
    isOwner: false,
    tone,
  })
  return find(tree, node => node.type === 'p' && node.props.children === caption.content)
}

test('[mock] CaptionViewV2 renders caption text in the requested tone', () => {
  assert.match(captionText('auto').props.className, /\btext-foreground\b/)
  assert.doesNotMatch(captionText('auto').props.className, /\btext-white\b/)
})

test('[mock] the dark default stays white for the modal’s dark overlay', () => {
  assert.match(captionText(undefined).props.className, /\btext-white\b/)
  const modal = readFileSync(new URL('../src/components/ui/caption-modal.tsx', import.meta.url),
    'utf8')
  assert.match(modal, /bg-black\/80/)
  assert.doesNotMatch(modal, /tone=/)
})

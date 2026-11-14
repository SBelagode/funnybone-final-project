// A minimal hook runtime for testing real components in Node without a DOM.
// State persists across renders, setters re-render on a microtask, and effects run after each
// render with React's dependency rules, including cleanups on change and unmount.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const sameDeps = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length
  && a.every((value, index) => Object.is(value, b[index]))

export function mount(path, exportName, props, mocks = {}) {
  const source = readFileSync(new URL(`../../src/${path}`, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX },
  })

  const hooks = []
  let index = 0
  let effects = []
  let tree = null
  let scheduled = false
  let mounted = true

  const react = {
    useState(initial) {
      const slot = index++
      if (!hooks[slot]) {
        const hook = { value: typeof initial === 'function' ? initial() : initial }
        hook.set = next => {
          const value = typeof next === 'function' ? next(hook.value) : next
          if (Object.is(value, hook.value)) return
          hook.value = value
          schedule()
        }
        hooks[slot] = hook
      }
      return [hooks[slot].value, hooks[slot].set]
    },
    useRef(initial) {
      const slot = index++
      hooks[slot] ??= { current: initial }
      return hooks[slot]
    },
    useCallback(callback, deps) {
      const slot = index++
      if (hooks[slot] && sameDeps(hooks[slot].deps, deps)) return hooks[slot].value
      hooks[slot] = { value: callback, deps }
      return callback
    },
    useEffect(effect, deps) {
      const slot = index++
      const hook = hooks[slot] ??= {}
      if (hook.ran && deps && sameDeps(hook.deps, deps)) return
      hook.ran = true
      hook.deps = deps
      effects.push(() => {
        hook.cleanup?.()
        const cleanup = effect()
        hook.cleanup = typeof cleanup === 'function' ? cleanup : undefined
      })
    },
  }
  const element = (type, elementProps) => ({ type, props: elementProps })
  const all = {
    react,
    'react/jsx-runtime': { Fragment: 'fragment', jsx: element, jsxs: element },
    ...(typeof mocks === 'function' ? mocks(react) : mocks),
  }
  const stub = new Proxy({}, { get: () => () => null })
  const exports = {}
  new Function('require', 'exports', outputText)(name => {
    if (name in all) return all[name]
    return name.startsWith('@/') ? stub : require(name)
  }, exports)

  function render() {
    if (!mounted) return
    index = 0
    effects = []
    tree = exports[exportName](props)
    for (const run of effects) run()
  }
  function schedule() {
    if (scheduled || !mounted) return
    scheduled = true
    queueMicrotask(() => {
      scheduled = false
      render()
    })
  }
  render()

  const nodes = () => {
    const found = []
    const pending = [tree]
    while (pending.length) {
      const node = pending.shift()
      if (Array.isArray(node)) pending.unshift(...node)
      else if (node?.props) {
        found.push(node)
        pending.unshift(node.props.children)
      }
    }
    return found
  }
  return {
    get tree() { return tree },
    findAll: matches => nodes().filter(matches),
    find(matches) {
      const node = nodes().find(matches)
      if (!node) throw new Error('element not found')
      return node
    },
    query: matches => nodes().find(matches) ?? null,
    async settle() {
      for (let pass = 0; pass < 25; pass++) await new Promise(resolve => setTimeout(resolve, 0))
    },
    unmount() {
      mounted = false
      for (const hook of hooks) hook?.cleanup?.()
    },
  }
}

export function textOf(node) {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  return textOf(node.props?.children)
}

// Records object URLs so tests can check that previews are created and released.
export function trackObjectUrls() {
  const created = []
  const revoked = []
  const original = { create: URL.createObjectURL, revoke: URL.revokeObjectURL }
  URL.createObjectURL = file => {
    const url = `blob:test/${created.length + 1}-${file.name}`
    created.push(url)
    return url
  }
  URL.revokeObjectURL = url => { revoked.push(url) }
  return {
    created,
    revoked,
    live: () => created.filter(url => !revoked.includes(url)),
    restore() {
      URL.createObjectURL = original.create
      URL.revokeObjectURL = original.revoke
    },
  }
}

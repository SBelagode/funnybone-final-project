// Mock tests: the real GenerateRoasts component and the real Crack Again refinement hook, with
// stubbed server actions and caption API. `server` simulates the image row. No request leaves
// this process.
import { afterEach, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { textOf, trackObjectUrls, walk } from './support/render-component.mjs'
import {
  contextRefinement, deferred, imageId, photo, renderGenerateRoasts,
} from './support/generate-roasts-fixture.mjs'

const { combineContext } = contextRefinement
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
let urls
let view

beforeEach(() => { urls = trackObjectUrls() })
afterEach(() => {
  view?.unmount()
  view = undefined
  urls.restore()
})

// Generates captions for a new upload (optionally with a nudge), then opens Crack Again.
async function openPanel({ nudge = '', ...options } = {}) {
  view = renderGenerateRoasts(options)
  await view.settle()
  view.typeNudge(nudge)
  view.selectFile(photo())
  await view.settle()
  await view.clickGenerate()
  await view.settle()
  assert.equal(view.shownCaptions().content, 'Mock caption', 'first captions are shown')
  await view.crackAgain()
  return view
}

const props = () => view.panelProps()
async function choose(mode, text) {
  props().onModeChange(mode)
  await view.settle()
  if (text !== undefined) {
    props().onTextChange(text)
    await view.settle()
  }
}
async function submit() {
  await props().onSubmit()
  await view.settle()
}
const effective = () => props().effective

test('[mock] Crack Again opens the panel and shows the saved context without generating',
  async () => {
    await openPanel({ nudge: 'Exam week' })
    assert.ok(view.panel(), 'the panel is open')
    assert.equal(props().status, 'ready')
    assert.equal(props().info.context, 'Exam week')
    assert.equal(props().mode, 'keep')
    assert.deepEqual(effective(), { ok: true, context: 'Exam week' })
    assert.equal(props().canSubmit, true)
    assert.equal(view.generations.length, 1, 'opening the panel does not generate')
    assert.equal(view.log.filter(entry => entry.startsWith('context-save')).length, 0)
  })

test('[mock] the panel shows a loading state while the saved context loads', async () => {
  const contextInfo = deferred()
  await openPanel({ hold: { contextInfo: contextInfo.promise } })
  assert.equal(props().status, 'loading')
  assert.equal(props().canSubmit, false)
  contextInfo.resolve()
  await view.settle()
  assert.equal(props().status, 'ready')
})

test('[mock] keep: no change is written, and the job sends the saved context', async () => {
  await openPanel({ nudge: 'Exam week' })
  await submit()
  assert.deepEqual(view.server.writes, [])
  assert.ok(view.log.includes('context-save:keep'), 'the server still verifies the context')
  const { snapshot } = view.generations.at(-1)
  assert.match(snapshot.requestId, uuid)
  assert.equal(snapshot.additionalContext, 'Exam week')
  assert.equal(view.panel(), null, 'the panel closes after success')
})

test('[mock] add: the context is appended on a new line and saved before generating',
  async () => {
    await openPanel({ nudge: 'Exam week' })
    await choose('append', '  Coffee ran out  ')
    assert.deepEqual(effective(), { ok: true, context: 'Exam week\nCoffee ran out' })
    await submit()
    assert.deepEqual(view.server.writes, ['Exam week\nCoffee ran out'])
    const saveAt = view.log.indexOf('context-save:append')
    assert.ok(saveAt > 0 && saveAt < view.log.lastIndexOf(`generate:${imageId}`),
      'saved before the job is submitted')
    assert.equal(view.generations.at(-1).snapshot.additionalContext,
      'Exam week\nCoffee ran out')
  })

test('[mock] add with no previous context uses only the addition', async () => {
  await openPanel()
  assert.equal(props().info.context, null)
  await choose('append', 'Coffee ran out')
  assert.deepEqual(effective(), { ok: true, context: 'Coffee ran out' })
  await submit()
  assert.deepEqual(view.server.writes, ['Coffee ran out'])
  assert.equal(view.generations.at(-1).snapshot.additionalContext, 'Coffee ran out')
})

test('[mock] replace: the new text takes the place of the saved context', async () => {
  await openPanel({ nudge: 'Exam week' })
  await choose('replace', 'Graduation day')
  assert.deepEqual(effective(), { ok: true, context: 'Graduation day' })
  await submit()
  assert.deepEqual(view.server.writes, ['Graduation day'])
  assert.equal(view.generations.at(-1).snapshot.additionalContext, 'Graduation day')
})

test('[mock] clear: the context is explicitly removed and the job sends null', async () => {
  await openPanel({ nudge: 'Exam week' })
  await choose('clear')
  assert.deepEqual(effective(), { ok: true, context: null })
  await submit()
  assert.deepEqual(view.server.writes, [null], 'clearing is a real write, unlike a blank nudge')
  assert.equal(view.generations.at(-1).snapshot.additionalContext, null)
})

test('[mock] add and replace need text; blank text cannot be submitted', async () => {
  await openPanel({ nudge: 'Exam week' })
  for (const mode of ['append', 'replace']) {
    await choose(mode, '   ')
    assert.equal(effective().ok, false)
    assert.equal(props().canSubmit, false)
    await submit()
  }
  assert.equal(view.log.filter(entry => entry.startsWith('context-save')).length, 0)
  assert.equal(view.generations.length, 1)
})

test('[mock] the 280-character limit applies to the combined context', async () => {
  const saved = 'a'.repeat(200)
  await openPanel({ nudge: saved })
  await choose('append', 'b'.repeat(80))
  // 200 + newline + 80 = 281
  assert.equal(effective().ok, false)
  assert.match(effective().error, /281 characters/)
  assert.equal(props().canSubmit, false)
  await submit()
  assert.equal(view.log.filter(entry => entry.startsWith('context-save')).length, 0)

  await choose('append', 'b'.repeat(79))
  assert.equal(effective().context.length, 280)
  assert.equal(props().canSubmit, true)
})

test('[mock] the ${ ban applies to the combined context', async () => {
  await openPanel({ nudge: 'Exam week' })
  await choose('replace', 'Use ${step1Output}')
  assert.equal(effective().ok, false)
  assert.equal(props().canSubmit, false)
})

test('[mock] cancel closes the panel with no save and no generation', async () => {
  await openPanel({ nudge: 'Exam week' })
  await choose('replace', 'Something new')
  props().onCancel()
  await view.settle()
  assert.equal(view.panel(), null)
  assert.equal(view.log.filter(entry => entry.startsWith('context-save')).length, 0)
  assert.deepEqual(view.server.writes, [])
  assert.equal(view.server.context, 'Exam week')
  assert.equal(view.generations.length, 1)

  await view.crackAgain()
  assert.equal(props().mode, 'keep', 'reopening starts fresh')
  assert.equal(props().text, '')
})

test('[mock] rapid clicks save once and start one generation', async () => {
  const saveContext = deferred()
  await openPanel({ nudge: 'Exam week', hold: { saveContext: saveContext.promise } })
  await choose('append', 'More')
  const clicks = [props().onSubmit(), props().onSubmit(), props().onSubmit()]
  await view.settle()
  assert.equal(props().isSaving, true)
  assert.equal(props().canSubmit, false)
  saveContext.resolve()
  await Promise.all(clicks)
  await view.settle()
  assert.equal(view.log.filter(entry => entry === 'context-save:append').length, 1)
  assert.equal(view.begun.length, 2, 'the first generation plus one regeneration')
  assert.equal(view.log.includes('cancelled-previous'), false)
  assert.deepEqual(view.server.writes, ['Exam week\nMore'])
})

test('[mock] an active job for the image blocks submitting and says why', async () => {
  view = renderGenerateRoasts()
  view.server.activeJob = true
  await view.settle()
  view.selectFile(photo())
  await view.settle()
  await view.clickGenerate()
  await view.settle()
  await view.crackAgain()
  assert.equal(props().info.activeJob, true)
  assert.equal(props().canSubmit, false)
  await submit()
  assert.equal(view.log.filter(entry => entry.startsWith('context-save')).length, 0)
})

test('[mock] a job that starts elsewhere before saving is refused by the server', async () => {
  await openPanel({ nudge: 'Exam week' })
  await choose('replace', 'New')
  view.server.activeJob = true
  await submit()
  assert.equal(props().error, 'Still running.')
  assert.equal(props().info.activeJob, true, 'the panel now blocks submitting')
  assert.deepEqual(view.server.writes, [])
  assert.equal(view.generations.length, 1)
})

test('[mock] a failed save stops generation and keeps the previous context', async () => {
  await openPanel({
    nudge: 'Exam week',
    saveContext: () => ({ ok: false, code: 'failed', error: 'We couldn’t save the context.' }),
  })
  await choose('replace', 'New')
  await submit()
  assert.equal(props().error, 'We couldn’t save the context.')
  assert.equal(props().info.context, 'Exam week')
  assert.equal(props().isRetry, false)
  assert.equal(props().canSubmit, true, 'the user can try again')
  assert.equal(view.generations.length, 1)
})

test('[mock] a save request that throws also stops generation', async () => {
  await openPanel({ saveContext: () => { throw new Error('network down') } })
  await choose('append', 'New')
  await submit()
  assert.match(props().error, /couldn’t save the context/)
  assert.equal(view.generations.length, 1)
})

test('[mock] a context changed elsewhere is not overwritten, and the panel refreshes',
  async () => {
    await openPanel({ nudge: 'Exam week' })
    view.server.context = 'Changed in another tab'
    await choose('append', 'Mine')
    await submit()
    assert.equal(props().error, 'Changed elsewhere.')
    assert.equal(props().info.context, 'Changed in another tab')
    assert.deepEqual(view.server.writes, [])
    assert.deepEqual(effective(), { ok: true, context: 'Changed in another tab\nMine' })
  })

test('[mock] a failed submission after saving shows the saved context and retries safely',
  async () => {
    let attempts = 0
    await openPanel({
      nudge: 'Exam week',
      generate: call => {
        if (call === 1) return [view.caption]
        attempts += 1
        if (attempts === 1) throw new Error('Unable to start captions (503).')
        return [{ ...view.caption, id: crypto.randomUUID(), content: 'Refined caption' }]
      },
    })
    await choose('append', 'Coffee ran out')
    await submit()
    assert.deepEqual(view.server.writes, ['Exam week\nCoffee ran out'])
    assert.match(props().error, /Your context was saved, but no new captions were made/)
    assert.match(props().error, /503/)
    assert.equal(props().info.context, 'Exam week\nCoffee ran out', 'shows what is saved')
    assert.equal(props().mode, 'keep')
    assert.deepEqual(effective(), { ok: true, context: 'Exam week\nCoffee ran out' },
      'the addition is not applied twice')
    assert.equal(props().isRetry, true)
    assert.equal(view.shownCaptions().content, 'Mock caption', 'earlier captions remain')

    await submit()
    assert.equal(view.log.filter(entry => entry.startsWith('context-save')).length, 1,
      'retry does not save again')
    const [failed, retried] = view.generations.slice(1).map(call => call.snapshot)
    assert.deepEqual(retried, failed, 'same request ID and context, so the same idempotency key')
    assert.deepEqual(view.server.writes, ['Exam week\nCoffee ran out'])
    assert.deepEqual(view.shownCaptions(), { content: 'Refined caption', index: 0, total: 2 })
  })

test('[mock] changing the choice after a failed submission starts a new request', async () => {
  let attempts = 0
  await openPanel({
    nudge: 'Exam week',
    generate: call => {
      if (call === 1) return [view.caption]
      attempts += 1
      if (attempts === 1) throw new Error('Unable to start captions (503).')
      return [{ ...view.caption, id: crypto.randomUUID() }]
    },
  })
  await choose('append', 'One')
  await submit()
  await choose('append', 'Two')
  assert.equal(props().isRetry, false)
  assert.deepEqual(effective(), { ok: true, context: 'Exam week\nOne\nTwo' })
  await submit()
  const [first, second] = view.generations.slice(1).map(call => call.snapshot)
  assert.notEqual(second.requestId, first.requestId, 'a new intent gets a new key')
  assert.equal(second.additionalContext, 'Exam week\nOne\nTwo')
})

test('[mock] new captions come first and every earlier caption is kept', async () => {
  await openPanel({ nudge: 'Exam week' })
  await choose('append', 'Round two')
  await submit()
  assert.deepEqual(view.shownCaptions(), { content: 'Mock caption 2', index: 0, total: 2 })
  await view.crackAgain()
  await choose('clear')
  await submit()
  assert.deepEqual(view.shownCaptions(), { content: 'Mock caption 3', index: 0, total: 3 })
  const all = view.find(node => node.type === view.ui.CaptionViewV2)
  assert.equal(all.props.hasNext, true)
})

test('[mock] a failed generation keeps the earlier captions on screen', async () => {
  await openPanel({
    generate: call => {
      if (call === 1) return [view.caption]
      throw new Error('No captions could be generated for this image. Please try again.')
    },
  })
  await submit()
  assert.deepEqual(view.shownCaptions(), { content: 'Mock caption', index: 0, total: 1 })
  assert.match(props().error, /No captions could be generated/)
})

test('[mock] the panel is hidden during generation and shows the loading screen', async () => {
  const hold = {}
  await openPanel({ nudge: 'Exam week', hold })
  const generate = deferred()
  hold.generate = generate.promise
  const run = props().onSubmit()
  await view.settle()
  assert.ok(view.query(node => node.type === view.ui.LoadingScreen), 'loading screen is shown')
  assert.equal(view.panel(), null)
  generate.resolve()
  await run
  await view.settle()
  assert.equal(view.shownCaptions().total, 2)
})

test('[mock] when the caption API cannot use a snapshot, only Keep is offered', async () => {
  await openPanel({ nudge: 'Exam week', refinement: false })
  assert.equal(props().info.refinement, false)
  await choose('replace', 'Not allowed')
  assert.equal(props().canSubmit, false)
  await choose('keep')
  assert.equal(props().canSubmit, true)
  await submit()
  assert.equal(view.log.filter(entry => entry.startsWith('context-save')).length, 0,
    'no context write is attempted')
  assert.equal(view.generations.at(-1).snapshot, undefined, 'the unmodified API gets {imageId}')
})

test('[mock] a context that fails to load disables submitting', async () => {
  await openPanel({ contextInfo: () => ({ ok: false, error: 'We couldn’t find this image.' }) })
  assert.equal(props().status, 'failed')
  assert.equal(props().loadError, 'We couldn’t find this image.')
  assert.equal(props().canSubmit, false)
})

test('[mock] Crack New Image closes the panel and resets the page', async () => {
  await openPanel({ nudge: 'Exam week' })
  view.find(node => node.type === 'button' && textOf(node).includes('Crack New Image'))
    .props.onClick()
  await view.settle()
  assert.equal(view.panel(), null)
  assert.equal(view.shownCaptions(), null)
})

test('[mock] Continue browsing during a regeneration does not update the reset page',
  async () => {
    const hold = {}
    await openPanel({ nudge: 'Exam week', hold })
    const generate = deferred()
    hold.generate = generate.promise
    const run = props().onSubmit()
    await view.settle()
    view.find(node => node.type === view.ui.LoadingScreen).props.onContinueBrowsing()
    await view.settle()
    generate.resolve()
    await run
    await view.settle()
    assert.equal(view.panel(), null)
    assert.equal(view.shownCaptions(), null, 'the chooser is shown, not old results')
    assert.ok(view.generateButton(), 'the page is ready for another image')
  })

// The panel itself, rendered directly from its props.
function renderPanel(overrides = {}) {
  const Panel = view.PanelComponent()
  const info = overrides.info ?? { ok: true, context: 'Exam week', refinement: true,
    activeJob: false, notice: null }
  const base = {
    status: 'ready', info, loadError: null, mode: 'keep', text: '',
    effective: combineContext(info.context, overrides.mode ?? 'keep', overrides.text ?? ''),
    error: null, isSaving: false, isRetry: false, canSubmit: true,
    onModeChange() {}, onTextChange() {}, onSubmit() {}, onCancel() {},
  }
  const nodes = walk(Panel({ ...base, ...overrides }))
  return {
    nodes,
    text: id => textOf(nodes.find(node => node.props.id === id)),
    radio: value => nodes.find(node => node.type === 'input' && node.props.value === value),
    button: label => nodes.find(node => node.type?.name !== undefined
      && textOf(node) === label && typeof node.props.onClick === 'function'),
    has: text => nodes.some(node => textOf(node).includes(text)),
  }
}

test('[mock] the panel shows the saved and effective context with the total count',
  async () => {
    await openPanel()
    const panel = renderPanel({ mode: 'append', text: 'Coffee ran out' })
    assert.equal(panel.text('refine-saved'), 'Exam week')
    assert.equal(panel.text('refine-effective'), 'Exam week\nCoffee ran out')
    assert.equal(panel.text('refine-effective-count'), '24/280 characters')
    assert.ok(panel.nodes.find(node => node.props.id === 'refine-text'), 'text box for adding')
    for (const label of ['Keep existing context', 'Add more context', 'Replace context',
      'Clear context']) assert.ok(panel.has(label), label)
  })

test('[mock] the panel disables other modes when only Keep is safe', async () => {
  await openPanel()
  const panel = renderPanel({
    info: { ok: true, context: 'Exam week', refinement: false, activeJob: false, notice: 'n' },
  })
  assert.equal(panel.radio('keep').props.disabled, false)
  for (const mode of ['append', 'replace', 'clear']) {
    assert.equal(panel.radio(mode).props.disabled, true, mode)
  }
})

test('[mock] Clear is unavailable when there is nothing saved', async () => {
  await openPanel()
  const panel = renderPanel({
    info: { ok: true, context: null, refinement: true, activeJob: false, notice: null },
  })
  assert.equal(panel.radio('clear').props.disabled, true)
  assert.ok(panel.has('There is no saved context to clear.'))
  assert.ok(panel.has('No context. Captions will use only the image.'))
})

test('[mock] the panel shows saving, error and retry states', async () => {
  await openPanel()
  const saving = renderPanel({ isSaving: true, canSubmit: false })
  assert.equal(saving.button('Saving…').props.disabled, true)
  assert.equal(saving.button('Cancel').props.disabled, true)
  const failed = renderPanel({ error: 'Your context was saved, but…', isRetry: true })
  assert.ok(failed.nodes.some(node => node.props.role === 'alert'
    && textOf(node).includes('Your context was saved')))
  assert.equal(failed.button('Retry').props.disabled, false)
  const tooLong = renderPanel({ mode: 'replace', text: 'x'.repeat(281) })
  assert.equal(tooLong.text('refine-effective-count'), '!/280 characters')
  assert.ok(tooLong.has('281 characters'))
})

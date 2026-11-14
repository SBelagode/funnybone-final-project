// Mock tests: the real GenerateRoasts component with stubbed server actions and caption API.
// No request leaves this process.
import { afterEach, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { trackObjectUrls } from './support/render-component.mjs'
import {
  cdnUrl, deferred, imageId, photo, renderGenerateRoasts,
} from './support/generate-roasts-fixture.mjs'

const link = 'https://example.test/memes/cat.jpg'
let urls
let view

beforeEach(() => { urls = trackObjectUrls() })
afterEach(() => {
  view?.unmount()
  view = undefined
  urls.restore()
})

async function render(options) {
  view = renderGenerateRoasts(options)
  await view.settle()
  return view
}

const ways = {
  'file picker': async (v, file = photo()) => { v.selectFile(file); await v.settle() },
  'drag and drop': async (v, file = photo()) => { v.dropFile(file); await v.settle() },
  'image URL': async v => v.enterUrl(link),
}

for (const [name, choose] of Object.entries(ways)) {
  test(`[mock] ${name}: choosing an image previews it without generating`, async () => {
    const v = await render()
    await choose(v)
    assert.deepEqual(v.requests(), [], 'nothing is uploaded, saved or generated yet')
    assert.equal(v.preview().props.src, name === 'image URL' ? link : urls.created[0])
    assert.equal(v.generateButton().props.disabled, false)
    assert.equal(v.hasText('Captions start only when you click Generate.'), true)
  })
}

test('[mock] Generate is disabled until an image is chosen', async () => {
  const v = await render()
  assert.equal(v.generateButton().props.disabled, true)
  assert.equal(v.hasText('Choose a photo or link to get started.'), true)
  await v.generateButton().props.onClick()
  await v.settle()
  assert.deepEqual(v.requests(), [], 'a direct click without an image does nothing')
})

test('[mock] a local file preview appears from an object URL', async () => {
  const v = await render()
  await ways['file picker'](v)
  assert.equal(urls.created.length, 1)
  assert.match(v.preview().props.src, /^blob:test\//)
  assert.equal(v.hasText('photo.png'), true)
})

test('[mock] generation starts only when Generate is clicked', async () => {
  const v = await render()
  await ways['file picker'](v)
  v.typeNudge('Midterm average was 42%')
  await v.settle()
  assert.deepEqual(v.requests(), [])
  await v.clickGenerate()
  await v.settle()
  assert.deepEqual(v.requests(), ['availability', 'begin', 'presign', 'put:photo.png',
    `register:${cdnUrl}`, 'save:Midterm average was 42%', `generate:${imageId}`])
})

test('[mock] the nudge is read when Generate is clicked, not when the image was chosen',
  async () => {
    const v = await render()
    v.typeNudge('First idea')
    await v.settle()
    await ways['file picker'](v)
    v.typeNudge('  Final idea  ')
    await v.settle()
    await v.clickGenerate()
    await v.settle()
    assert.ok(v.log.includes('save:Final idea'))
    assert.equal(v.log.includes('save:First idea'), false)
  })

test('[mock] edits made after clicking Generate do not change that generation', async () => {
  const availability = deferred()
  const v = await render({ hold: { availability: availability.promise } })
  await ways['file picker'](v)
  v.typeNudge('Clicked with this')
  await v.settle()
  const run = v.clickGenerate()
  await v.settle()
  v.typeNudge('Typed afterwards')
  await v.settle()
  availability.resolve()
  await run
  await v.settle()
  assert.ok(v.log.includes('save:Clicked with this'))
  assert.equal(v.log.includes('save:Typed afterwards'), false)
})

test('[mock] replacing the image keeps the nudge, frees the old preview and uses the new file',
  async () => {
    const v = await render()
    v.typeNudge('Keep me')
    await ways['file picker'](v, photo('first.png'))
    const [firstUrl] = urls.created
    await ways['file picker'](v, photo('second.png'))
    assert.deepEqual(urls.revoked, [firstUrl])
    assert.deepEqual(urls.live(), [urls.created[1]])
    assert.equal(v.preview().props.src, urls.created[1])
    assert.equal(v.nudgeValue(), 'Keep me')
    await v.clickGenerate()
    await v.settle()
    assert.ok(v.log.includes('put:second.png'))
    assert.equal(v.log.includes('put:first.png'), false)
    assert.equal(v.begun.at(-1).name, 'second.png')
  })

test('[mock] dropping a new file onto the preview replaces the image', async () => {
  const v = await render()
  await ways['file picker'](v, photo('first.png'))
  v.dropFile(photo('dropped.png'))
  await v.settle()
  assert.equal(v.hasText('dropped.png'), true)
  assert.equal(urls.live().length, 1)
})

test('[mock] switching from a file to a link frees the file preview', async () => {
  const v = await render()
  await ways['file picker'](v)
  await v.enterUrl(link)
  assert.deepEqual(urls.live(), [])
  assert.equal(v.preview().props.src, link)
  await v.clickGenerate()
  await v.settle()
  assert.deepEqual(v.requests().filter(entry => /presign|put|register/.test(entry)),
    [`register:${link}`])
})

test('[mock] removing the image disables Generate but keeps the nudge', async () => {
  const v = await render()
  v.typeNudge('Still here')
  await ways['file picker'](v)
  v.clickButton('Remove')
  await v.settle()
  assert.equal(v.preview(), null)
  assert.equal(v.generateButton().props.disabled, true)
  assert.equal(v.nudgeValue(), 'Still here')
  assert.deepEqual(urls.live(), [])
  assert.deepEqual(v.requests(), [])
})

for (const blank of ['', '   \n ']) {
  test(`[mock] a ${blank ? 'whitespace' : 'empty'} nudge generates with no nudge requests`,
    async () => {
      const v = await render({ available: false })
      v.typeNudge(blank)
      await ways['file picker'](v)
      await v.clickGenerate()
      await v.settle()
      assert.deepEqual(v.requests(), ['begin', 'presign', 'put:photo.png',
        `register:${cdnUrl}`, `generate:${imageId}`])
      assert.deepEqual(v.toasts, [])
    })
}

test('[mock] repeated clicks start one generation', async () => {
  const availability = deferred()
  const v = await render({ hold: { availability: availability.promise } })
  v.typeNudge('A nudge')
  await ways['file picker'](v)
  const first = v.clickGenerate()
  const second = v.clickGenerate()
  await v.settle()
  assert.equal(v.generateButton().props.disabled, true)
  assert.match(String(v.generateButton().props.children), /Starting/)
  availability.resolve()
  await Promise.all([first, second])
  await v.settle()
  assert.equal(v.log.filter(entry => entry === 'availability').length, 1)
  assert.equal(v.log.filter(entry => entry === 'begin').length, 1)
  assert.equal(v.log.includes('cancelled-previous'), false)
})

test('[mock] repeated clicks with a blank nudge also start one generation', async () => {
  const register = deferred()
  const v = await render({ hold: { register: register.promise } })
  await ways['file picker'](v)
  const clicks = [v.clickGenerate(), v.clickGenerate(), v.clickGenerate()]
  await v.settle()
  register.resolve()
  await Promise.all(clicks)
  await v.settle()
  assert.equal(v.log.filter(entry => entry === 'begin').length, 1)
  assert.equal(v.log.includes('cancelled-previous'), false)
})

test('[mock] Generate works again after a blocked attempt', async () => {
  const v = await render({ available: false })
  v.typeNudge('A nudge')
  await ways['file picker'](v)
  await v.clickGenerate()
  await v.settle()
  assert.equal(v.generateButton().props.disabled, false, 'the click guard is released')
  await v.clickGenerate()
  await v.settle()
  assert.equal(v.log.filter(entry => entry === 'availability').length, 2)
  assert.equal(v.log.includes('begin'), false)
})

test('[mock] Continue browsing frees the page for another generation', async () => {
  const register = deferred()
  const v = await render({ hold: { register: register.promise } })
  await ways['file picker'](v, photo('first.png'))
  const first = v.clickGenerate()
  await v.settle()
  v.find(node => node.type === v.ui.LoadingScreen).props.onContinueBrowsing()
  await v.settle()
  assert.equal(v.preview(), null, 'the chooser resets for the next image')
  assert.deepEqual(urls.live(), [])
  await ways['file picker'](v, photo('second.png'))
  assert.equal(v.generateButton().props.disabled, false)
  const second = v.clickGenerate()
  await v.settle()
  register.resolve()
  await Promise.all([first, second])
  await v.settle()
  assert.deepEqual(v.begun.map(file => file.name), ['first.png', 'second.png'])
  assert.equal(v.log.includes('cancelled-previous'), false)
})

test('[mock] a finished generation shows its captions and frees the preview', async () => {
  const v = await render()
  await ways['file picker'](v)
  await v.clickGenerate()
  await v.settle()
  const result = v.find(node => node.type === v.ui.CaptionViewV2)
  assert.equal(result.props.content, v.caption.content)
  assert.equal(result.props.imageUrl, cdnUrl)
  assert.equal(v.preview(), null)
  assert.deepEqual(urls.live(), [])
})

test('[mock] a failed generation keeps the image so the user can retry', async () => {
  const v = await render({ save: () => ({ ok: false, error: 'Nope' }) })
  v.typeNudge('A nudge')
  await ways['file picker'](v)
  await v.clickGenerate()
  await v.settle()
  assert.ok(v.preview(), 'the selection stays')
  assert.equal(v.generateButton().props.disabled, false)
  assert.equal(v.toasts.at(-1).description, 'Nope')
})

test('[mock] unmounting frees the preview URL', async () => {
  const v = await render()
  await ways['file picker'](v)
  assert.equal(urls.live().length, 1)
  v.unmount()
  assert.deepEqual(urls.live(), [])
})

test('[mock] unsupported files and links are not selected', async () => {
  const v = await render()
  v.selectFile(photo('notes.pdf', 'application/pdf'))
  await v.settle()
  await v.enterUrl('not a url')
  await v.enterUrl('https://example.test/page.html')
  assert.equal(v.preview(), null)
  assert.deepEqual(urls.created, [])
  assert.deepEqual(v.toasts.map(item => item.title),
    ['Invalid Image Type', 'Invalid URL', 'Invalid Image Type'])
})

test('[mock] an invalid nudge disables Generate', async () => {
  const v = await render()
  await ways['file picker'](v)
  v.typeNudge('${step1Output}')
  await v.settle()
  assert.equal(v.generateButton().props.disabled, true)
  assert.equal(v.hasText('Fix your nudge to continue.'), true)
})

test('[mock] a preview that fails to load still allows generation', async () => {
  const v = await render()
  await v.enterUrl(link)
  v.preview().props.onError()
  await v.settle()
  assert.equal(v.preview(), null)
  assert.equal(v.hasText('We couldn’t show a preview of this image'), true)
  assert.equal(v.generateButton().props.disabled, false)
})

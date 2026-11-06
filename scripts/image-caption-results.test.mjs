import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const source = readFileSync(new URL(
  '../src/app/image/[imageId]/captions/page.tsx', import.meta.url,
), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
  },
})
const imageId = randomUUID()
const user = { id: randomUUID(), app_metadata: {} }
const row = () => ({ id: randomUUID(), image_id: imageId, content: 'Saved job caption',
  is_public: false, profile_id: user.id, humor_flavor_id: null })

function loadPage(rows = [], currentUser = user) {
  const queries = []
  const supabase = {
    auth: { getUser: async () => ({ data: { user: currentUser } }) },
    from(table) {
      const query = { table, filters: {} }
      queries.push(query)
      return {
        select() { return this },
        eq(column, value) { query.filters[column] = value; return this },
        async single() {
          return { data: { id: imageId, url: '/image.png', is_common_use: true }, error: null }
        },
        async in(column, ids) {
          query.ids = ids
          return {
            data: rows.filter(caption => ids.includes(caption[column])
              && Object.entries(query.filters).every(([key, value]) => caption[key] === value)),
            error: null,
          }
        },
      }
    },
  }
  const exports = {}
  const mocks = {
    '@/utils/supabase/server': { createClient: async () => supabase },
    './image-captions-page-client': { ImageCaptionsPageClient: () => null },
    'next/navigation': {
      notFound: () => { throw new Error('NOT_FOUND') },
      redirect: path => { throw new Error(`REDIRECT:${path}`) },
    },
  }
  // Exercise the real server page with only its external boundaries replaced.
  new Function('require', 'exports', outputText)(name => mocks[name] ?? require(name), exports)
  return {
    queries,
    render: captionIds => exports.default({
      params: Promise.resolve({ imageId }),
      searchParams: Promise.resolve({ captionIds }),
    }),
  }
}

test('saved results include only requested captions, in job order, beyond the usual page limit',
  async () => {
    const captions = Array.from({ length: 12 }, row)
    const otherJob = row()
    const { render, queries } = loadPage([otherJob, ...captions.toReversed()])
    const ids = captions.map(caption => caption.id)
    const page = await render(ids.join(','))
    assert.deepEqual(page.props.initialCaptions.map(caption => caption.id), ids)
    assert.equal(page.props.imageId, imageId)
    assert.equal(queries[1].filters.image_id, imageId)
    assert.deepEqual(queries[1].ids, ids)
  })

test('opening a different job for the same image resets the carousel', async () => {
  const first = row()
  const second = row()
  const { render } = loadPage([first, second])
  const firstPage = await render(first.id)
  const secondPage = await render(second.id)
  assert.notEqual(firstPage.key, secondPage.key)
  assert.deepEqual(secondPage.props.initialCaptions.map(caption => caption.id), [second.id])
})

test('ordinary image links still use the existing generation flow', async () => {
  const { render, queries } = loadPage()
  const page = await render(undefined)
  assert.equal(page.props.initialCaptions, undefined)
  assert.equal(queries.length, 1)
})

test('missing, inaccessible, or mismatched-image results never fall back to new generation',
  async () => {
    const missing = row()
    const wrongImage = { ...row(), image_id: randomUUID() }
    const { render } = loadPage([wrongImage])
    await assert.rejects(render(missing.id), /NOT_FOUND/)
    await assert.rejects(render(wrongImage.id), /NOT_FOUND/)
  })

test('malformed result links are rejected before querying the database', async () => {
  const { render, queries } = loadPage()
  for (const value of ['', 'invalid', `${randomUUID()},`, [randomUUID(), randomUUID()]]) {
    await assert.rejects(render(value), /NOT_FOUND/)
  }
  assert.deepEqual(queries, [])
})

test('saved results require a signed-in, non-anonymous user', async () => {
  for (const currentUser of [null, { ...user, is_anonymous: true }]) {
    const { render, queries } = loadPage([], currentUser)
    await assert.rejects(render(randomUUID()), /REDIRECT:\/login/)
    assert.deepEqual(queries, [])
  }
})

test('larger result sets load in batches without losing or duplicating captions', async () => {
  const captions = Array.from({ length: 105 }, row)
  const { render, queries } = loadPage(captions.toReversed())
  const ids = captions.map(caption => caption.id)
  const page = await render([...ids, ids[0]].join(','))
  assert.deepEqual(page.props.initialCaptions.map(caption => caption.id), ids)
  assert.deepEqual(queries.filter(query => query.table === 'captions')
    .map(query => query.ids.length), [100, 5])
})

// Mock tests: Supabase is stubbed here, so these do not exercise real RLS.
import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'
import * as imageNudge from '../src/utils/image-nudge.ts'
import * as uploadFlow from '../src/utils/nudge-upload-flow.ts'

const require = createRequire(import.meta.url)
const { outputText } = ts.transpileModule(readFileSync(new URL(
  '../src/app/actions/images/update-image-nudge-action.ts', import.meta.url,
), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS },
})

const imageId = randomUUID()
const user = { id: randomUUID(), app_metadata: {} }

const updatedRow = { data: [{ id: imageId }], error: null }

function loadAction({ currentUser = user, result = updatedRow } = {}) {
  const calls = { clients: 0, tables: [], update: null, eq: {}, not: [], select: null }
  const query = {
    update(values) { calls.update = values; return this },
    eq(column, value) { calls.eq[column] = value; return this },
    not(...args) { calls.not.push(args); return this },
    async select(columns) { calls.select = columns; return result },
  }
  const supabase = {
    auth: { getUser: async () => ({ data: { user: currentUser } }) },
    from(table) { calls.tables.push(table); return query },
  }
  const mocks = {
    '@/utils/image-nudge': imageNudge,
    '@/utils/nudge-upload-flow': uploadFlow,
    '@/utils/supabase/server': {
      createClient: async () => { calls.clients += 1; return supabase },
    },
  }
  const exports = {}
  new Function('require', 'exports', outputText)(name => mocks[name] ?? require(name), exports)
  return { ...exports, calls }
}

function withFlag(value, run) {
  return async t => {
    const previous = process.env.ENABLE_NUDGE_PERSISTENCE
    if (value === undefined) delete process.env.ENABLE_NUDGE_PERSISTENCE
    else process.env.ENABLE_NUDGE_PERSISTENCE = value
    try {
      await run(t)
    } finally {
      if (previous === undefined) delete process.env.ENABLE_NUDGE_PERSISTENCE
      else process.env.ENABLE_NUDGE_PERSISTENCE = previous
    }
  }
}

for (const value of [undefined, '', 'false', '0', '1', 'TRUE', 'yes', ' true ']) {
  test(`[mock] flag ${JSON.stringify(value)} fails closed before touching Supabase`,
    withFlag(value, async () => {
      const { updateImageNudgeAction, getNudgeAvailabilityAction, calls } = loadAction()
      const result = await updateImageNudgeAction(imageId, 'A real nudge')
      assert.equal(result.ok, false)
      assert.match(result.error, /unavailable/)
      assert.equal(await getNudgeAvailabilityAction(), false)
      assert.equal(calls.clients, 0)
      assert.equal(calls.update, null)
    }))
}

test('[mock] a public flag name cannot enable persistence', withFlag(undefined, async () => {
  process.env.NEXT_PUBLIC_ENABLE_NUDGE_PERSISTENCE = 'true'
  try {
    const { getNudgeAvailabilityAction } = loadAction()
    assert.equal(await getNudgeAvailabilityAction(), false)
  } finally {
    delete process.env.NEXT_PUBLIC_ENABLE_NUDGE_PERSISTENCE
  }
}))

test('[mock] a valid nudge updates only the owned, non-shared image',
  withFlag('true', async () => {
    const { updateImageNudgeAction, getNudgeAvailabilityAction, calls } = loadAction()
    assert.equal(await getNudgeAvailabilityAction(), true)
    assert.deepEqual(await updateImageNudgeAction(imageId, '  Midterm average was 42%.  '), {
      ok: true,
    })
    assert.deepEqual(calls.tables, ['images'])
    assert.deepEqual(calls.update, {
      additional_context: 'Midterm average was 42%.',
      modified_by_user_id: user.id,
    })
    assert.deepEqual(calls.eq, { id: imageId, profile_id: user.id })
    assert.deepEqual(calls.not, [['is_common_use', 'is', true]])
    assert.equal(calls.select, 'id')
  }))

test('[mock] the server revalidates nudges instead of trusting the browser',
  withFlag('true', async () => {
    const invalid = ['${imageDescription}', 'a'.repeat(imageNudge.MAX_NUDGE_LENGTH + 1)]
    for (const nudge of invalid) {
      const { updateImageNudgeAction, calls } = loadAction()
      assert.equal((await updateImageNudgeAction(imageId, nudge)).ok, false)
      assert.equal(calls.clients, 0)
    }
  }))

test('[mock] blank or malformed input never clears existing context',
  withFlag('true', async () => {
    for (const nudge of ['', '   ', null, undefined, 42, { toString: () => 'x' }]) {
      const { updateImageNudgeAction, calls } = loadAction()
      assert.equal((await updateImageNudgeAction(imageId, nudge)).ok, false)
      assert.equal(calls.update, null)
    }
  }))

test('[mock] malformed image IDs are rejected before querying',
  withFlag('true', async () => {
    for (const id of ['not-a-uuid', '', null, `${imageId}' OR '1'='1`]) {
      const { updateImageNudgeAction, calls } = loadAction()
      assert.equal((await updateImageNudgeAction(id, 'A nudge')).ok, false)
      assert.equal(calls.clients, 0)
    }
  }))

test('[mock] signed-out and anonymous users cannot save a nudge',
  withFlag('true', async () => {
    const users = [
      null,
      { id: randomUUID(), is_anonymous: true, app_metadata: {} },
      { id: randomUUID(), app_metadata: { provider: 'anonymous' } },
    ]
    for (const currentUser of users) {
      const { updateImageNudgeAction, calls } = loadAction({ currentUser })
      const result = await updateImageNudgeAction(imageId, 'A nudge')
      assert.equal(result.ok, false)
      assert.match(result.error, /sign in/)
      assert.equal(calls.update, null)
    }
  }))

test('[mock] zero updated rows is a failure, as when the image belongs to someone else',
  withFlag('true', async () => {
    const { updateImageNudgeAction } = loadAction({ result: { data: [], error: null } })
    const result = await updateImageNudgeAction(imageId, 'A nudge')
    assert.equal(result.ok, false)
    assert.match(result.error, /couldn’t find this image on your account/)
  }))

test('[mock] any row count other than one is a failure', withFlag('true', async () => {
  for (const data of [null, [{ id: imageId }, { id: randomUUID() }]]) {
    const { updateImageNudgeAction } = loadAction({ result: { data, error: null } })
    assert.equal((await updateImageNudgeAction(imageId, 'A nudge')).ok, false)
  }
}))

test('[mock] database errors stay friendly and keep the nudge out of logs',
  withFlag('true', async t => {
    const logged = t.mock.method(console, 'error', () => {})
    const nudge = 'A very private nudge'
    const { updateImageNudgeAction } = loadAction({
      result: { data: null, error: { code: '23514', details: `Failing row contains ${nudge}` } },
    })
    assert.deepEqual(await updateImageNudgeAction(imageId, nudge), {
      ok: false,
      error: uploadFlow.NUDGE_SAVE_FAILED_ERROR,
    })
    assert.equal(logged.mock.callCount(), 1)
    assert.doesNotMatch(JSON.stringify(logged.mock.calls[0].arguments), /private nudge/)
  }))

import test from 'node:test'
import assert from 'node:assert/strict'
import { MAX_NUDGE_LENGTH, normalizeNudge, validateNudge } from '../src/utils/image-nudge.ts'

test('normalizing trims surrounding whitespace and keeps inner text', () => {
  assert.equal(normalizeNudge('  midterm\naverage was 42%\t\n'), 'midterm\naverage was 42%')
})

test('blank nudges are valid and produce no nudge', () => {
  for (const value of ['', '   ', '\n\t  \r\n']) {
    assert.deepEqual(validateNudge(value), { ok: true, nudge: null })
  }
})

test('a normal nudge is returned trimmed', () => {
  assert.deepEqual(validateNudge('  A Columbia class where the midterm average was 42%.  '), {
    ok: true,
    nudge: 'A Columbia class where the midterm average was 42%.',
  })
})

test('the length limit is inclusive and applies after trimming', () => {
  const longest = 'a'.repeat(MAX_NUDGE_LENGTH)
  assert.deepEqual(validateNudge(longest), { ok: true, nudge: longest })
  assert.deepEqual(validateNudge(`  ${longest}  `), { ok: true, nudge: longest })
  assert.equal(validateNudge(`${longest}a`).ok, false)
})

test('template-variable sequences are rejected', () => {
  for (const value of ['${imageDescription}', 'before ${step1Output} after', 'unclosed ${']) {
    const result = validateNudge(value)
    assert.equal(result.ok, false)
    assert.match(result.error, /\$\{/)
  }
})

test('ordinary dollar signs and braces are allowed', () => {
  for (const value of ['Textbooks cost $200', 'a {set} of $ {spaced} braces', '100% $']) {
    assert.deepEqual(validateNudge(value), { ok: true, nudge: value })
  }
})

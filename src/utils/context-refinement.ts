// Shared by the Crack Again panel (for its preview) and the server action (which is the
// authority). The server always recomputes the result from the context saved in the database.
import { MAX_NUDGE_LENGTH } from '@/utils/image-nudge'

export type RefinementMode = 'keep' | 'append' | 'replace' | 'clear'
export const REFINEMENT_MODES: readonly RefinementMode[] = ['keep', 'append', 'replace', 'clear']

export type EffectiveContext = { ok: true; context: string | null } | { ok: false; error: string }

// Blank or whitespace-only context is stored and compared as "no context".
export function normalizeContext(value: string | null | undefined): string | null {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed || null
}

export function combineContext(
  saved: string | null,
  mode: RefinementMode,
  text = '',
): EffectiveContext {
  const current = normalizeContext(saved)
  const addition = normalizeContext(text)
  let context: string | null
  if (mode === 'keep') context = current
  else if (mode === 'clear') context = null
  else if (!addition) {
    return {
      ok: false,
      error: mode === 'append'
        ? 'Type the context you want to add.'
        : 'Type the new context, or choose Clear context to remove it.',
    }
  } else context = mode === 'append' && current ? `${current}\n${addition}` : addition

  if (context && context.length > MAX_NUDGE_LENGTH) {
    return {
      ok: false,
      error: `The context for this generation is ${context.length} characters. `
        + `Keep it to ${MAX_NUDGE_LENGTH} or fewer.`,
    }
  }
  if (context?.includes('${')) {
    return { ok: false, error: 'The context can’t include “${”. Please remove it.' }
  }
  return { ok: true, context }
}

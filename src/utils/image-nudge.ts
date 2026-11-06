export const MAX_NUDGE_LENGTH = 280

export type NudgeValidation =
  | { ok: true; nudge: string | null }
  | { ok: false; error: string }

export function normalizeNudge(value: string): string {
  return value.trim()
}

// A blank nudge is valid and returns null, so callers can leave the default flow untouched.
export function validateNudge(value: string): NudgeValidation {
  const nudge = normalizeNudge(value)
  if (!nudge) return { ok: true, nudge: null }
  if (nudge.length > MAX_NUDGE_LENGTH) {
    return { ok: false, error: `Keep your nudge to ${MAX_NUDGE_LENGTH} characters or fewer.` }
  }
  // Humor flavor prompts use ${name} placeholders, and the caption API that fills them
  // is outside this repo. Reject the syntax rather than assume user text is never expanded.
  if (nudge.includes('${')) {
    return { ok: false, error: 'Your nudge can’t include “${”. Please remove it.' }
  }
  return { ok: true, nudge }
}

'use client'

// Crack Again on /new: review the image's saved context, choose how to change it, then generate.
// The server action recomputes and validates the result, saves it with a compare-and-set, and
// returns the exact context the job then sends as its own copy (a context snapshot).
import { useCallback, useRef, useState } from 'react'
import { generateCaptions } from '@/app/actions/captions'
import { getImageContextAction, updateImageContextAction } from '@/app/actions/images'
import type { ImageContextInfo } from '@/app/actions/images/image-context-action'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { combineContext, type RefinementMode } from '@/utils/context-refinement'
import { MAX_NUDGE_LENGTH } from '@/utils/image-nudge'
import type { Caption } from '@/utils/types'
import type { useCaptionGeneration } from '@/hooks/useCaptionGeneration'

type LoadedInfo = Extract<ImageContextInfo, { ok: true }>
// A request whose context is already saved. Retrying it reuses its ID, so the API either
// resumes the same job or starts it once.
type PendingRequest = { requestId: string; context: string | null }

const modes: { value: RefinementMode; label: string; hint: string }[] = [
  { value: 'keep', label: 'Keep existing context', hint: 'Generate again with no changes.' },
  { value: 'append', label: 'Add more context', hint: 'Adds a new line after the saved context.' },
  { value: 'replace', label: 'Replace context', hint: 'Swap the saved context for new text.' },
  { value: 'clear', label: 'Clear context', hint: 'Remove the saved context and generate '
    + 'without any.' },
]

export type ContextRefinementPanelProps = {
  status: 'loading' | 'ready' | 'failed'
  info: LoadedInfo | null
  loadError: string | null
  mode: RefinementMode
  text: string
  effective: ReturnType<typeof combineContext> | null
  error: string | null
  isSaving: boolean
  isRetry: boolean
  canSubmit: boolean
  onModeChange: (mode: RefinementMode) => void
  onTextChange: (text: string) => void
  onSubmit: () => void
  onCancel: () => void
}

export function useContextRefinement({
  imageId,
  imagePreview,
  generation,
  onCaptions,
  toast,
}: {
  imageId: string | null
  imagePreview: string | null
  generation: ReturnType<typeof useCaptionGeneration>
  onCaptions: (captions: Caption[]) => void
  toast: (options: { title: string; description?: string }) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState<ContextRefinementPanelProps['status']>('loading')
  const [info, setInfo] = useState<LoadedInfo | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [mode, setMode] = useState<RefinementMode>('keep')
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [pending, setPending] = useState<PendingRequest | null>(null)
  // Set synchronously, so a second click cannot submit before the button re-renders disabled.
  const busy = useRef<object | null>(null)
  // Ignores a context load that finishes after the panel was closed or reopened.
  const session = useRef<object | null>(null)

  const reset = useCallback(() => {
    session.current = null
    busy.current = null
    setIsOpen(false)
    setInfo(null)
    setLoadError(null)
    setMode('keep')
    setText('')
    setError(null)
    setIsSaving(false)
    setPending(null)
  }, [])

  const load = async (token: object) => {
    if (!imageId) return
    setStatus('loading')
    try {
      const result = await getImageContextAction(imageId)
      if (session.current !== token) return
      if (result.ok) {
        setInfo(result)
        setStatus('ready')
      } else {
        setLoadError(result.error)
        setStatus('failed')
      }
    } catch {
      if (session.current !== token) return
      setLoadError('We couldn’t load this image’s context. Close this and try again.')
      setStatus('failed')
    }
  }

  const open = () => {
    if (isOpen || !imageId) return
    const token = {}
    session.current = token
    setIsOpen(true)
    setMode('keep')
    setText('')
    setError(null)
    setPending(null)
    void load(token)
  }

  // Closing only discards what was typed. Nothing has been written at this point.
  const cancel = () => {
    if (busy.current) return
    reset()
  }

  // Changing the choice after a failed submission starts a new request with a new key.
  const changeMode = (next: RefinementMode) => {
    if (busy.current) return
    setMode(next)
    setPending(null)
    setError(null)
  }
  const changeText = (next: string) => {
    if (busy.current) return
    setText(next)
    setPending(null)
  }

  const effective = info ? combineContext(info.context, mode, text) : null
  const canSubmit = isOpen && status === 'ready' && Boolean(info) && !isSaving
    && !generation.isLoading && !info?.activeJob && Boolean(effective?.ok)
    && (Boolean(info?.refinement) || mode === 'keep')

  const submit = async () => {
    if (busy.current || !canSubmit || !info || !imageId) return
    const token = {}
    busy.current = token
    setIsSaving(true)
    setError(null)
    let request: PendingRequest | null = null
    try {
      if (info.refinement) {
        request = pending
        if (!request) {
          let saved: Awaited<ReturnType<typeof updateImageContextAction>>
          try {
            saved = await updateImageContextAction(imageId, {
              mode, text, expected: info.context,
            })
          } catch {
            saved = { ok: false, code: 'failed',
              error: 'We couldn’t save the context. Nothing changed. Please try again.' }
          }
          if (busy.current !== token) return
          if (!saved.ok) {
            const { code, current } = saved
            if (code === 'conflict' && current !== undefined) {
              setInfo(previous => previous && { ...previous, context: current })
            }
            if (code === 'busy') setInfo(previous => previous && { ...previous, activeJob: true })
            setError(saved.error)
            return
          }
          request = { requestId: crypto.randomUUID(), context: saved.context }
          // From here the panel shows what is saved, and Retry sends the same request.
          setInfo(previous => previous && { ...previous, context: saved.context })
          setMode('keep')
          setText('')
          setPending(request)
        }
      }

      const operation = generation.begin(imagePreview ?? undefined)
      let partial = false
      try {
        const captions = await generateCaptions(imageId, {
          ...operation,
          onPartialFailure: () => { partial = true },
          ...(request ? {
            contextSnapshot: { requestId: request.requestId, additionalContext: request.context },
          } : {}),
        })
        operation.complete(captions)
        if (!operation.isCurrent()) return
        onCaptions(captions)
        reset()
        toast(partial
          ? { title: 'Some captions are ready',
            description: 'Some humor flavors could not finish. Showing the captions that '
              + 'succeeded.' }
          : { title: 'Crack Again', description: 'New captions were added before the earlier '
            + 'ones.' })
      } catch (failure) {
        operation.fail(failure)
        if (!operation.isCurrent()) return
        const message = failure instanceof Error ? failure.message : 'Captions didn’t start.'
        setError(request ? `Your context was saved, but no new captions were made. ${message}`
          : message)
      } finally {
        operation.finish()
      }
    } finally {
      if (busy.current === token) {
        busy.current = null
        setIsSaving(false)
      }
    }
  }

  const panel: ContextRefinementPanelProps | null = isOpen ? {
    status,
    info,
    loadError,
    mode,
    text,
    effective,
    error,
    isSaving,
    isRetry: Boolean(pending),
    canSubmit,
    onModeChange: changeMode,
    onTextChange: changeText,
    onSubmit: submit,
    onCancel: cancel,
  } : null

  return { panel, open, reset }
}

const contextBox = 'whitespace-pre-wrap break-words rounded-lg border bg-muted/30 px-3 py-2 '
  + 'text-sm'

export function ContextRefinementPanel(props: ContextRefinementPanelProps) {
  const { status, info, mode, effective, isSaving } = props
  const needsText = mode === 'append' || mode === 'replace'
  const length = effective?.ok ? effective.context?.length ?? 0 : null
  return (
    <section
      aria-labelledby="refine-heading"
      className="mx-auto mt-4 w-full max-w-[650px] space-y-4 rounded-2xl border
                 bg-background p-4 text-left shadow-sm"
    >
      <h2 id="refine-heading" className="text-base font-semibold">Crack it again</h2>

      {status === 'loading' && (
        <p role="status" className="text-sm text-muted-foreground">Loading saved context…</p>
      )}
      {status === 'failed' && (
        <p role="alert" className="text-sm text-destructive">{props.loadError}</p>
      )}

      {status === 'ready' && info && (
        <>
          <div className="space-y-1">
            <p className="text-sm font-medium">Saved context</p>
            <p id="refine-saved" className={contextBox}>
              {info.context ?? 'No context saved for this image.'}
            </p>
          </div>

          {info.notice && (
            <p role="status" className="text-xs text-muted-foreground">{info.notice}</p>
          )}

          <fieldset className="space-y-2" disabled={isSaving}>
            <legend className="text-sm font-medium">What should change?</legend>
            {modes.map(option => {
              const disabled = (!info.refinement && option.value !== 'keep')
                || (option.value === 'clear' && !info.context)
              return (
                <label
                  key={option.value}
                  className={`flex items-start gap-2 text-sm ${disabled ? 'opacity-50' : ''}`}
                >
                  <input
                    type="radio"
                    name="refine-mode"
                    value={option.value}
                    checked={mode === option.value}
                    disabled={disabled}
                    onChange={() => props.onModeChange(option.value)}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-medium">{option.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {option.value === 'clear' && !info.context
                        ? 'There is no saved context to clear.' : option.hint}
                    </span>
                  </span>
                </label>
              )
            })}
          </fieldset>

          {needsText && (
            <div className="space-y-1">
              <label htmlFor="refine-text" className="text-sm font-medium">
                {mode === 'append' ? 'Context to add' : 'New context'}
              </label>
              <Textarea
                id="refine-text"
                value={props.text}
                onChange={event => props.onTextChange(event.target.value)}
                disabled={isSaving}
                rows={3}
                aria-describedby="refine-effective-count"
                placeholder={mode === 'append'
                  ? 'e.g. It was the night before the final'
                  : 'e.g. My roommate after finals week'}
              />
            </div>
          )}

          <div className="space-y-1">
            <p className="text-sm font-medium">Context for this generation</p>
            <p id="refine-effective" className={contextBox}>
              {effective?.ok
                ? effective.context ?? 'No context. Captions will use only the image.'
                : '—'}
            </p>
            <p
              id="refine-effective-count"
              className={`text-right text-xs ${length === null
                ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              {length ?? '!'}/{MAX_NUDGE_LENGTH} characters
            </p>
            {effective && !effective.ok && (
              <p role="alert" className="text-xs text-destructive">{effective.error}</p>
            )}
          </div>
        </>
      )}

      {props.error && (
        <p role="alert" className="text-sm text-destructive">{props.error}</p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={props.onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="button" onClick={props.onSubmit} disabled={!props.canSubmit}>
          {isSaving ? 'Saving…' : props.isRetry ? 'Retry' : 'Generate new captions'}
        </Button>
      </div>
    </section>
  )
}

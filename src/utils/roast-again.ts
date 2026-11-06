import { generateCaptions } from '@/app/actions/captions'
import type { Caption } from '@/utils/types'
import type { useCaptionGeneration } from '@/hooks/useCaptionGeneration'

type RoastAgainCommonArgs = {
  toast: (opts: { title: string; description?: string }) => void
  generation: ReturnType<typeof useCaptionGeneration>
  kind: 'start' | 'my-images'
}
type RoastAgainGenerateArgs = RoastAgainCommonArgs & {
  kind: 'start'
  imagePreview: string | null
  resetUploader: () => void
  imageId: string | null
  setRoasts: (value: Caption[] | ((prev: Caption[]) => Caption[])) => void
}
type RoastAgainPageArgs = RoastAgainCommonArgs & {
  kind: 'my-images'
  imageId: string
  imageUrl: string
  applyNewCaptions: (captions: Caption[]) => void
}

export async function roastAgain(args: RoastAgainGenerateArgs | RoastAgainPageArgs) {
  const { toast, generation } = args
  const operation = generation.begin(args.kind === 'start'
    ? args.imagePreview ?? undefined : args.imageUrl)
  try {
    if (args.kind === 'start' && !args.imagePreview) {
      args.resetUploader()
      return
    }
    if (!args.imageId) throw new Error('imageId not found.')
    let partial = false
    const captions = await generateCaptions(args.imageId, {
      ...operation,
      onPartialFailure: () => { partial = true },
    })
    operation.complete(captions)
    if (!operation.isCurrent()) return
    if (args.kind === 'my-images') args.applyNewCaptions(captions)
    else args.setRoasts(prev => prev.length ? [...captions, ...prev] : captions)
    toast({
      title: partial ? 'Some captions are ready' : 'Roast Again',
      description: partial
        ? 'Some humor flavors could not finish. Showing the captions that succeeded.'
        : 'New captions have been added!',
    })
  } catch (error) {
    operation.fail(error)
    if (!operation.isCurrent()) return
    console.error('Error roasting again:', error)
    toast({
      title: 'Error',
      description: error instanceof Error ? error.message : 'Failed to roast again.',
    })
  } finally {
    operation.finish()
  }
}

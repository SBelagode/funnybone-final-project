'use client'

import { useEffect, useState, useImperativeHandle, forwardRef } from 'react'
import Image from 'next/image'
import type { CaptionJobUpdate } from '@/utils/caption-job-client'

interface LoadingScreenProps {
  onContinueBrowsing?: () => void
  job?: CaptionJobUpdate | null
}

export interface LoadingScreenRef {
  completeProgress: () => void
}

// Loading messages created by Maya
const loadingMessages = [
  'Cracking image...',
  'Warming up the punchlines...',
  'Consulting the comedy gods...',
  'Daydreaming about our stand-up special...',
  'Taking one last look at your outfit...',
  'Buffering your delusions...',
  'Calling our mom for comedic validation...',
  'Fact-checking our jokes (kind of)...',
  'Brewing fresh sarcasm...',
  'Rehearsing comebacks in the mirror...',
  'Arguing with the joke committee...',
  'Sent the joke to the group chat, got left on read...',
  'Testing material on a fake audience...',
  'Polishing punchlines to a petty shine...',
  'Holding an emergency roast meeting...',
  'Calibrating sass levels...',
  'Crashing from too many dad jokes...',
  'Pacing nervously before showtime...',
  'Recharging the sarcasm batteries...',
  'Regretting our last joke already...',
  'Filtering out the HR violations...',
  'Deciding if irony is still in...',
  'Debugging the funny circuit...',
  'Rebooting after a comedic identity crisis...',
  'Whispering “don’t hold back” to ourselves...',
  'Scheduling a vibe check with legal...',
  'Pretending this roast is peer-reviewed...',
  'Overthinking the punchline... again...',
  'Having a mid-roast crisis...',
  'Typing... deleting... spiraling...',
  'Googling “how to be funny under pressure”...',
  'Stalling while the punchline finds itself...',
  'Channeling our inner washed-up comic...',
  'Wondering if this is too niche to be funny...',
  'Getting notes from our imaginary editor...',
  'Drowning in discarded joke drafts...',
  'Reading old tweets for “research”...',
  'Still recovering from our last punchline...',
  'Tuning our humor frequency to ✨petty✨...',
  'Loading punchlines from the cloud...',
  'Curating chaos, please hold...',
  'Injecting wit into the algorithm...',
  'Running pun diagnostics...',
  'Syncing with the meme mainframe...',
  'Letting the intrusive thoughts cook...',
  'Roasting ourselves to warm up...',
]

const LoadingScreen = forwardRef<LoadingScreenRef, LoadingScreenProps>(
  ({ onContinueBrowsing, job }, ref) => {
  const [currentImage, setCurrentImage] = useState(1)
  const [shuffledMessages] = useState<string[]>(() =>
    [...loadingMessages].sort(() => Math.random() - 0.5)
  )
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  
  // Function to complete the progress bar (can be called externally)
  const completeProgress = () => {
    setProgress(100)
  }
  
  useImperativeHandle(ref, () => ({
    completeProgress
  }))

  useEffect(() => {
    // Disable body scroll when loading screen is active
    document.body.style.overflow = 'hidden'
    
    const imageInterval = setInterval(() => {
      // Randomly select a number between 1 and 8
      setCurrentImage(Math.floor(Math.random() * 8) + 1)
    }, 500)

    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % shuffledMessages.length)
    }, 3300)

    return () => {
      // Re-enable body scroll when loading screen is unmounted
      document.body.style.overflow = 'unset'
      clearInterval(imageInterval)
      clearInterval(messageInterval)
    }
  }, [shuffledMessages.length])

  const percentage = job?.progress.totalSteps
    ? Math.round(job.progress.completedSteps / job.progress.totalSteps * 100)
    : progress
  const waiting = !job || job.status === 'queued'

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/90 z-50">
      <div className="relative w-80 max-w-full">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />

        {/* Main content */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Rotating image container */}
          <div className="relative w-48 h-48 mb-4 shrink-0">
            <div className="absolute inset-0 animate-spin-slow">
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src={`/loading/loading${currentImage}.png`}
                  alt="Loading..."
                  width={160}
                  height={160}
                  className="transform hover:scale-110 transition-transform duration-300"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Fun loading text */}
          <div className="space-y-4 text-center">
            <h2 className="text-2xl font-bold text-primary animate-bounce">
              {shuffledMessages[currentMessageIndex]}
            </h2>
            
            <p className="text-sm text-white/80" role="status" aria-live="polite">
              {!job ? 'Preparing your image…' : waiting ? 'Your captions are queued…'
                : `${job.progress.completedSteps} of ${job.progress.totalSteps} steps complete`}
            </p>
            {/* Use saved checkpoints; preparing/queued work has no estimated percentage. */}
            <div className="w-full max-w-xs mx-auto">
              <div
                className="w-full h-2 bg-gray-700 rounded-full overflow-hidden"
                role="progressbar"
                aria-label="Caption generation progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={waiting ? undefined : percentage}
              >
                <div 
                  className={`h-full bg-primary rounded-full transition-all duration-300 ease-out
                    ${waiting ? 'animate-pulse' : ''}`}
                  style={{ width: waiting ? '25%' : `${percentage}%` }}
                />
              </div>
            </div>
            {onContinueBrowsing && (
              <button
                onClick={onContinueBrowsing}
                className="mt-4 px-6 py-2 bg-primary hover:bg-primary/90
                 text-primary-foreground hover:text-primary-foreground/80 rounded-full border
                border-primary hover:border-primary/90 transition-all 
                  duration-300 text-sm font-medium mx-auto block"
              >
                Continue browsing
              </button>
            )}
            {onContinueBrowsing && (
              <p className="text-xs text-white/70">
                Don&apos;t worry, we&apos;ll notify you when your captions are done.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

LoadingScreen.displayName = 'LoadingScreen'

export default LoadingScreen

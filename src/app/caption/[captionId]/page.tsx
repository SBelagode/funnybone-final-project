'use client'

import { useEffect, useState } from 'react'
import {
  fetchCaptionByIdAction,
  insertSaveAction,
  deleteSaveAction,
  fetchSavedCaptionsAction,
} from '@/app/actions/captions'
import { CaptionViewV2 } from '@/components/ui/caption-view-v2'
import { useToast } from '@/hooks/use-toast'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.crackd.ai'

interface CaptionPageProps {
  params: Promise<{ captionId: string }>
}

export default function CaptionPage({ params }: CaptionPageProps) {
  const [captionId, setCaptionId] = useState<string | null>(null)
  const [captionData, setCaptionData] = useState<{
    id: string
    content: string
    image_url: string
    roast_image_id: string
    is_public: boolean
    is_owner: boolean
  } | null>(null)

  const [savedCaptions, setSavedCaptions] = useState<string[]>([])

  const { toast } = useToast()

  useEffect(() => {
    async function resolveParams() {
      try {
        const resolvedParams = await params
        setCaptionId(resolvedParams.captionId)
      } catch (error) {
        console.error('Error resolving params:', error)
      }
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    async function fetchData() {
      if (!captionId) return
      try {
        const data = await fetchCaptionByIdAction(captionId)
        setCaptionData(data)
      } catch (error) {
        console.error('Error fetching caption:', error)
      }
    }
    fetchData()
  }, [captionId])

  // Fetch saved captions from Supabase
  useEffect(() => {
    async function fetchSaves() {
      try {
        const saved = await fetchSavedCaptionsAction()
        const savedIds = saved.map((item) => item.id) // use caption.id
        setSavedCaptions(savedIds)
      } catch (error) {
        console.error('Failed to fetch saved captions:', error)
      }
    }

    fetchSaves()
  }, [])

  // Handle save/unsave click
  const handleSaveClick = async (captionId: string) => {
    const isSaved = savedCaptions.includes(captionId)
    const originalState = savedCaptions

    try {
      if (isSaved) {
        setSavedCaptions((prev) => prev.filter((id) => id !== captionId))
        await deleteSaveAction(captionId)
      } else {
        setSavedCaptions((prev) => [...prev, captionId])
        await insertSaveAction(captionId)
      }
    } catch (error) {
      console.error('Error updating save:', error)
      setSavedCaptions(originalState)
      toast({
        title: 'Error',
        description: 'Failed to update save. Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (!captionData) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-start justify-center px-4 pb-8 pt-2">
      <CaptionViewV2
        id={captionData.id}
        imageUrl={captionData.image_url}
        content={captionData.content}
        saved={savedCaptions.includes(captionData.id)}
        onSave={handleSaveClick}
        shareUrl={`${baseUrl}/caption/${captionData.id}`}
        isPublic={captionData.is_public}
        isOwner={captionData.is_owner}
        tone="auto"
        imageClassName="h-[50vh] w-auto max-w-full object-contain"
        containerClassName="w-full flex items-center justify-center mb-8 mt-0"
      />
    </div>
  )
}

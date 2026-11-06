'use client'
import { useCallback, useEffect, useState } from 'react'
import {
  fetchUsedCommonUseImagesAction,
} from '@/app/actions/images/fetch-used-common-use-images-action'
import { useToast } from '@/hooks/use-toast'
import { CaptionModal } from '@/components/ui/caption-modal'
import LoadingScreen from '@/components/LoadingScreen'
import { useCaptionGeneration } from '@/hooks/useCaptionGeneration'
import { ImageWithCaptions } from '@/utils/types'
import { toggleCaptionSave } from '@/utils/toggle-caption-save'
import { deleteSlide } from '@/utils/delete-slide'
import { roastAgain } from '@/utils/roast-again'
import { loadSavedCaptionIds } from '@/utils/saved-caption-ids'
import { useRouter } from 'next/navigation'
import { PhotoTabContent } from '@/components/ui/my-images'
import { checkAuthStatusAction } from '@/app/actions/auth/check-auth-status'
import {
  fetchImagesWithCaptionsAction,
} from '../actions/images/fetch-images-with-captions-action'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import DeleteConfirmationModal from '@/components/ui/deleteConfirmationModal'

export default function UserImagesPage() {
  const [userImages, setUserImages] = useState<ImageWithCaptions[]>([])
  const [showCarousel, setShowCarousel] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const generation = useCaptionGeneration()
  const cancelGeneration = generation.cancel
  const loadingRoast = generation.isLoading
  const [loadingImages, setLoadingImages] = useState(true)
  const [savedCaptions, setSavedCaptions] = useState<string[]>([])
  const [tab, setTab] = useState('uploaded')
  const [communityImages, setCommunityImages] = useState<ImageWithCaptions[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [currentCaptionIndex, setCurrentCaptionIndex] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()
  const router = useRouter()

  // new states for pagination and dropdown
  const [visibleCount, setVisibleCount] = useState(8)
  const [itemsPerPage, setItemsPerPage] = useState(8)

  const dropdownItems = [4, 8, 12, 16, 20, 24]

  // Fetch user images with captions on component mount
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const images = await fetchImagesWithCaptionsAction()
        setUserImages(images)
      } catch (error) {
        console.error('Error fetching user images:', error)
        toast({
          title: 'Error',
          description: 'Failed to load user images.',
        })
      } finally {
        setLoadingImages(false)
      }
    }

    fetchImages()
    loadUserInfo()
  }, [toast])

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const images = await fetchUsedCommonUseImagesAction()
        setCommunityImages(images)
      } catch (error) {
        console.error('Error fetching community images:', error)
      }
    }

    fetchCommunity()
  }, [])

  // Bootstrap saved captions so carousel can reflect initial save state
  useEffect(() => {
    loadSavedCaptionIds().then(setSavedCaptions)
  }, [toast])

  const handleImageSelect = (imageId: string) => {
    const images = tab === 'community' ? communityImages : userImages
    const index = images.findIndex((image) => image.id === imageId)
    if (index >= 0) {
      setSelectedImageIndex(index)
      setShowCarousel(true)
    }
  }

  const closeCarousel = useCallback(() => {
    cancelGeneration()
    setShowCarousel(false)
    setSelectedImageIndex(null)
  }, [cancelGeneration])

  const handleCrackNewImage = () => {
    closeCarousel()
    router.push('/new')
  }

  const handleDeleteCurrentImage = async (imageUrl: string) => {
    await deleteSlide({
      imageUrl,
      isCommunity: tab === 'community',
      communityImages,
      setCommunityImages,
      setUserImages,
      closeCarousel,
      toast,
    })
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCarousel) {
        closeCarousel()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [showCarousel, closeCarousel])

  useEffect(() => {
    if (selectedImageIndex !== null) {
      setCurrentCaptionIndex(0)
    }
  }, [selectedImageIndex])

  const roastImage = async () => {
    if (loadingRoast || selectedImageIndex === null) return
    const currentImages = getCurrentImages()
    const selectedImage = currentImages[selectedImageIndex]

    await roastAgain({
      kind: 'my-images',
      toast,
      generation,
      imageId: selectedImage.id,
      imageUrl: selectedImage.url,
      applyNewCaptions: (captions) => {
        if (tab === 'community') {
          const updatedImages = [...communityImages]
          updatedImages[selectedImageIndex].captions = [
            ...captions,
            ...updatedImages[selectedImageIndex].captions,
          ]
          setCommunityImages(updatedImages)
        } else {
          const updatedImages = [...userImages]
          updatedImages[selectedImageIndex].captions = [
            ...captions,
            ...updatedImages[selectedImageIndex].captions,
          ]
          setUserImages(updatedImages)
        }
        // Reset caption index to show the first new caption
        setCurrentCaptionIndex(0)
      },
    })
  }

  const getCurrentImages = () => {
    return tab === 'community' ? communityImages : userImages
  }

  // Load user information
  const loadUserInfo = async () => {
    try {
      const { userId: currentUserId } = await checkAuthStatusAction()
      setUserId(currentUserId)
    } catch (error) {
      console.error('Error loading user info:', error)
      setUserId(null)
    }
  }

  const handleSlideSave = (captionId: string) =>
    toggleCaptionSave({
      captionId,
      savedCaptions,
      setSavedCaptions,
      toast,
    })

  const normalizedSearchTerm = searchTerm.trim().toLowerCase()

  const filterImages = (images: ImageWithCaptions[], term: string) => {
    if (!term) return images
    return images.filter((image) => {
      const matchId = image.id?.toLowerCase().includes(term)
      const matchUrl = image.url?.toLowerCase().includes(term)
      const matchDescription = String(image.image_description ?? '').toLowerCase().includes(term)
      const matchAdditionalContext = String(image.additional_context ?? '')
        .toLowerCase()
        .includes(term)
      const matchCelebrityRecognition = String(image.celebrity_recognition ?? '')
        .toLowerCase()
        .includes(term)
      const matchCaption = image.captions?.some((caption) =>
        caption.content?.toLowerCase().includes(term)
      )
      return (
        matchId ||
        matchUrl ||
        matchDescription ||
        matchAdditionalContext ||
        matchCelebrityRecognition ||
        matchCaption
      )
    })
  }

  const filteredUserImages = filterImages(userImages, normalizedSearchTerm)
  const filteredCommunityImages = filterImages(communityImages, normalizedSearchTerm)

  // Pagination logic
  const visibleImages = filteredUserImages.slice(0, visibleCount)
  const hasMore = visibleCount < filteredUserImages.length

  const loadMore = () => {
    setVisibleCount((prev) => prev + itemsPerPage)
  }

  const handleItemsPerPageChange = (value: string) => {
    const newValue = parseInt(value)
    setItemsPerPage(newValue)
    setVisibleCount(newValue)
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setVisibleCount(itemsPerPage)
  }

  const communityDeleteDescription = [
    'Are you sure you want to delete your captions for this image?',
    'The image will remain public, but all your captions for it will be removed.',
  ].join(' ')
  const uploadedDeleteDescription =
    'Are you sure you want to delete this image and all of your captions generated for it?'
  const currentImage =
    selectedImageIndex === null ? null : getCurrentImages()[selectedImageIndex]
  const modalItems =
    currentImage?.captions?.map((caption) => ({
      id: caption.id,
      content: caption.content,
      imageUrl: currentImage.url,
      isPublic: caption.is_public,
      isOwner: caption.profile_id === userId,
    })) ?? []
  const modalActionButtons = (
    <>
      <button
        onClick={handleCrackNewImage}
        className="bg-primary text-primary-foreground px-6 py-3 rounded-lg 
                        font-semibold hover:bg-primary/90 transition-colors 
                        duration-200 flex items-center gap-2"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Crack New Image
      </button>

      <button
        onClick={roastImage}
        className="bg-white/10 text-white px-6 py-3 rounded-lg font-semibold 
                          hover:bg-white/20 transition-colors duration-200 flex items-center 
                          gap-2 border border-white/20"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 
                                11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Crack This Again
      </button>

      {currentImage && (
        <DeleteConfirmationModal
          onConfirmDelete={() => handleDeleteCurrentImage(currentImage.url)}
          itemName={tab === 'community' ? 'your captions' : 'this image'}
          description={
            tab === 'community' ? communityDeleteDescription : uploadedDeleteDescription
          }
        />
      )}
    </>
  )
  const modalActions = (
    <div
      className="flex flex-col sm:flex-row gap-4 
                      justify-center items-center mt-8"
    >
      {modalActionButtons}
    </div>
  )
  const modalEmptyState = (
    <div className="text-center text-white">
      <p className="text-lg mb-4">No captions available for this image</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        {modalActionButtons}
      </div>
    </div>
  )

  return (
    <div>
      {/* Tab switcher (Uploaded vs Community) - Centered with fixed width */}
      <div className="flex justify-center mb-6">
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as 'uploaded' | 'community')}
          className="w-full max-w-[470px]"
        >
          <TabsList
            className="relative flex justify-between w-full h-[36px] sm:h-[44px] 
              bg-transparent rounded-3xl border border-[#666363] overflow-hidden p-0"
          >
            {/* Primary Slider */}
            <div
              className={`absolute top-0 left-0 h-[36px] sm:h-[44px] w-1/2 rounded-[16px] 
                bg-primary dark:bg-primary/40
                         transition-all duration-300 ${
                          tab === "uploaded"
                            ? "rounded-l-3xl rounded-r-none"
                            : "rounded-r-3xl rounded-l-none"
                        }`}
              style={{
                transform: `translateX(${tab === "uploaded" ? 0 : 100}%)`,
              }}
            />

            <TabsTrigger
              value="uploaded"
              className="relative w-1/2 h-full flex items-center justify-center
                        text-xs sm:text-sm md:text-base font-normal leading-[120%]
                        tracking-[-0.02em] z-10 transition-[color,border-color] 
                        duration-200 text-gray-800 dark:text-[#9A9A9A]
                        data-[state=active]:dark:text-primary 
                        data-[state=active]:border-2 data-[state=active]:border-primary
                        data-[state=active]:bg-transparent
                        rounded-l-3xl rounded-r-none border-0 bg-transparent"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              My Uploaded Photos
            </TabsTrigger>
            <TabsTrigger
              value="community"
              className="relative w-1/2 h-full flex items-center justify-center
                        text-xs sm:text-sm md:text-base font-normal leading-[120%]
                        tracking-[-0.02em] z-10 transition-[color,border-color] 
                        duration-200 text-gray-800 dark:text-[#9A9A9A]
                        data-[state=active]:dark:text-primary 
                        data-[state=active]:border-2 data-[state=active]:border-primary
                        data-[state=active]:bg-transparent
                        rounded-r-3xl rounded-l-none border-0 bg-transparent"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Community Photos
            </TabsTrigger>

            {/* Vertical Border */}
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-[#666363] z-0"
              style={{ left: "50%" }}
            />
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Content - Full width container */}
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as 'uploaded' | 'community')}
        className="w-full"
      >
        {/* Uploaded Photos Tab Content */}
        <TabsContent value="uploaded">
          <PhotoTabContent
            tabName="Your Uploaded Photos"
            images={filteredUserImages}
            visibleImages={visibleImages}
            loading={loadingImages}
            hasMore={hasMore}
            itemsPerPage={itemsPerPage}
            dropdownItems={dropdownItems}
            handleItemsPerPageChange={handleItemsPerPageChange}
            searchTerm={searchTerm}
            handleSearchChange={handleSearchChange}
            handleImageSelect={handleImageSelect}
            loadMore={loadMore}
            emptyMessage={
              normalizedSearchTerm
                ? 'No photos match your search.'
                : 'No uploaded images available.'
            }
          />
        </TabsContent>

        {/* Community Photos Tab Content */}
        <TabsContent value="community">
          <PhotoTabContent
            tabName="Community Photos You've Used"
            images={filteredCommunityImages}
            visibleImages={filteredCommunityImages.slice(0, visibleCount)}
            loading={false}
            hasMore={visibleCount < filteredCommunityImages.length}
            itemsPerPage={itemsPerPage}
            dropdownItems={dropdownItems}
            handleItemsPerPageChange={handleItemsPerPageChange}
            searchTerm={searchTerm}
            handleSearchChange={handleSearchChange}
            handleImageSelect={handleImageSelect}
            loadMore={loadMore}
            emptyMessage={
              normalizedSearchTerm
                ? "No photos match your search."
                : "You haven't used any community images yet."
            }
          />
        </TabsContent>
      </Tabs>

      {/* Carousel Modal */}
      {showCarousel && selectedImageIndex !== null && (
        <CaptionModal
          items={modalItems}
          currentIndex={currentCaptionIndex}
          onClose={closeCarousel}
          onIndexChange={setCurrentCaptionIndex}
          savedCaptionIds={savedCaptions}
          onSave={handleSlideSave}
          actions={modalItems.length > 0 ? modalActions : undefined}
          emptyState={modalEmptyState}
        />
      )}

      {loadingRoast && (
        <LoadingScreen
          onContinueBrowsing={generation.continueBrowsing}
          job={generation.progress}
        />
      )}
    </div>
  )
}

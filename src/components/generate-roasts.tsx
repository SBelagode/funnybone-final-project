'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  generateCaptions,
  generatePresignedUrl,
  uploadImageFromUrl,
  fetchPopularCaptionsByImageIdAction,
} from '@/app/actions/captions'
import {
  fetchCommonUseCategoriesAction,
  fetchCommonUseImagesAction,
  fetchImagesWithCaptionsAction,
} from '@/app/actions/images'
import { checkAuthStatusAction } from '@/app/actions/auth/check-auth-status'
import { FileUpload } from '@/components/ui/file-upload'
import LoadingScreen from '@/components/LoadingScreen'
import { ImageGridSkeleton } from '@/components/ui/image-grid-skeleton'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { IconChevronDown } from '@tabler/icons-react'
import { UrlInputModal } from '@/components/ui/url-input-modal'
import { CaptionViewV2 } from '@/components/ui/caption-view-v2'
import { OptimizedImageGrid } from '@/components/OptimizedImageGrid'
import {
  Caption,
  CommonUseCategory,
  CommonUseImage,
  GenerateRoastsProps,
  ImageWithCaptions,
} from '@/utils/types'
import { uploadImageViaSignedUrl } from '@/utils/upload-image-signed-url'
import { toggleCaptionSave } from '@/utils/toggle-caption-save'
import { roastAgain as roastAgainUtil } from '@/utils/roast-again'
import { hasValidImageExtension, validExtensions } from '@/utils/valid-extension'
import { loadSavedCaptionIds } from '@/utils/saved-caption-ids'
import { buildCaptionShareUrl } from '@/utils/site-url'
import { useCaptionGeneration } from '@/hooks/useCaptionGeneration'

function isValidUrl(url: string) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function GenerateRoasts({
  onRoastsGenerated,
  maxCaptions = 10,
  redirectOnSelect = false,
}: GenerateRoastsProps) {
  const [imageUrl, setImageUrl] = useState('')
  const generation = useCaptionGeneration()
  const { isLoading } = generation
  const [imageId, setImageId] = useState<string | null>(null)
  const [roasts, setRoasts] = useState<Caption[]>([])
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [bookmarkedCaptions, setBookmarkedCaptions] = useState<string[]>([])
  const [userImages, setUserImages] = useState<ImageWithCaptions[]>([])
  const [commonUseImages, setCommonUseImages] = useState<CommonUseImage[]>([])
  const [isLoadingCommonImages, setIsLoadingCommonImages] = useState(false)
  const [categories, setCategories] = useState<CommonUseCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [commonUsePage, setCommonUsePage] = useState(1)
  const [commonUsePageSize, setCommonUsePageSize] = useState(8)
  const [commonUseTotalCount, setCommonUseTotalCount] = useState(0)
  const [isItemsDropdownOpen, setIsItemsDropdownOpen] = useState(false)
  const [librarySearchTerm, setLibrarySearchTerm] = useState('')
  const [libraryPageSize, setLibraryPageSize] = useState(8)
  const [libraryVisibleCount, setLibraryVisibleCount] = useState(8)
  const [isLibraryDropdownOpen, setIsLibraryDropdownOpen] = useState(false)
  const [tab, setTab] = useState<'banger' | 'library'>('banger')
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false)
  const [currentCaptionIndex, setCurrentCaptionIndex] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const notifyPartialFailure = () => toast({
    title: 'Some captions are ready',
    description: 'Some humor flavors could not finish. Showing the captions that succeeded.',
  })
  const itemsPerPageOptions = [4, 8, 12, 16, 20, 24]
  const hasMoreCommonImages = commonUseImages.length < commonUseTotalCount
  const isInitialCommonImagesLoading = isLoadingCommonImages && commonUsePage === 1

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim())
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Load user information
  const loadUserInfo = useCallback(async () => {
    try {
      const { userId: currentUserId } = await checkAuthStatusAction()
      setUserId(currentUserId)
    } catch (error) {
      console.error('Error loading user info:', error)
      setUserId(null)
    }
  }, [])

  const loadBookmarkedCaptions = useCallback(async () => {
    const bookmarkedIds = await loadSavedCaptionIds()
    setBookmarkedCaptions(bookmarkedIds)
  }, [])

  const loadUserImages = useCallback(async () => {
    try {
      const images = await fetchImagesWithCaptionsAction()
      setUserImages(images)
    } catch (error) {
      // Don't show error toast for "User not found" errors (common during initial load)
      if (error instanceof Error && error.message === 'User not found.') {
        console.log('User not found, skipping user images')
        return
      }
      console.error('Error loading user images:', error)
      toast({
        title: 'Error',
        description: 'Failed to load your uploaded images.',
      })
    }
  }, [toast])

  const loadCategories = useCallback(async () => {
    try {
      const categoriesData = await fetchCommonUseCategoriesAction()
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast({
        title: 'Error',
        description: 'Failed to load categories.',
      })
    }
  }, [toast])

  const loadCommonImages = useCallback(
    (
    categoryId?: number,
    search?: string,
    page?: number,
    pageSize?: number
    ) => {
    setIsLoadingCommonImages(true)

    fetchCommonUseImagesAction(categoryId, search, page, pageSize)
      .then(({ images, totalCount }) => {
        const nextPage = page ?? 1
        setCommonUseImages((prev) =>
          nextPage > 1 ? [...prev, ...images] : images
        )
        setCommonUseTotalCount(totalCount)
        setIsLoadingCommonImages(false)
      })
      .catch((error) => {
        console.error('Error fetching common images:', error)
        toast({
          title: 'Error',
          description: 'Failed to load images.',
        })
        setIsLoadingCommonImages(false)
        if (!page || page <= 1) {
          setCommonUseImages([])
          setCommonUseTotalCount(0)
        }
      })
  }, [toast])

  // Load common use images and categories when component mounts
  useEffect(() => {
    loadCategories()
    loadUserImages()
    loadBookmarkedCaptions()
    loadUserInfo()
  }, [loadCategories, loadUserImages, loadBookmarkedCaptions, loadUserInfo])

  useEffect(() => {
    const categoryId =
      selectedCategory === 'all' ? undefined : parseInt(selectedCategory)
    loadCommonImages(categoryId, debouncedSearchTerm, commonUsePage, commonUsePageSize)
  }, [selectedCategory, debouncedSearchTerm, commonUsePage, commonUsePageSize, loadCommonImages])

  const resetCommonImagesPagination = () => {
    setCommonUsePage(1)
  }

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
    resetCommonImagesPagination()
  }

  const handleItemsPerPageChange = (value: number) => {
    setCommonUsePageSize(value)
    resetCommonImagesPagination()
  }

  const normalizedLibrarySearchTerm = librarySearchTerm.trim().toLowerCase()

  const filterLibraryImages = (images: ImageWithCaptions[], term: string) => {
    if (!term) return images
    return images.filter((image) => {
      const matchId = image.id?.toLowerCase().includes(term)
      const matchUrl = image.url?.toLowerCase().includes(term)
      const matchCaption = image.captions?.some((caption) =>
        caption.content?.toLowerCase().includes(term)
      )
      return matchId || matchUrl || matchCaption
    })
  }

  const filteredLibraryImages = filterLibraryImages(userImages, normalizedLibrarySearchTerm)
  const visibleLibraryImages = filteredLibraryImages.slice(0, libraryVisibleCount)
  const hasMoreLibraryImages = libraryVisibleCount < filteredLibraryImages.length
  const libraryGridImages = visibleLibraryImages.map(({ id, url }) => ({ id, url }))

  const handleLibraryItemsPerPageChange = (value: number) => {
    setLibraryPageSize(value)
    setLibraryVisibleCount(value)
  }

  const handleLibrarySearchChange = (value: string) => {
    setLibrarySearchTerm(value)
    setLibraryVisibleCount(libraryPageSize)
  }

  const loadMoreLibraryImages = () => {
    setLibraryVisibleCount((prev) => prev + libraryPageSize)
  }

  const loadMoreCommonImages = () => {
    if (!isLoadingCommonImages) {
      setCommonUsePage((prev) => prev + 1)
    }
  }

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return

    const file = files[0]
    if (!hasValidImageExtension(file.name)) {
      toast({
        title: 'Invalid Image Type',
        description: `Please upload an image with one of these types: 
        ${Array.from(validExtensions).join(', ')}`,
      })
      return
    }

    const operation = generation.begin(file)

    try {
      const contentType = `image/${file.type.split('/')[1]}`

      const presignedUrlResponse = await generatePresignedUrl(contentType, operation.signal)

      const presignedUrl = presignedUrlResponse.presignedUrl
      const cdnUrl = presignedUrlResponse.cdnUrl

      await uploadImageViaSignedUrl(file, presignedUrl, operation.signal)

      operation.signal.throwIfAborted()
      const uploadedImageId = await uploadImageFromUrl(cdnUrl, false, operation.signal)
      operation.signal.throwIfAborted()
      if (operation.isCurrent()) {
        setImageId(uploadedImageId)
        setImagePreview(cdnUrl)
      }
      const captions = await generateCaptions(uploadedImageId, {
        ...operation,
        onPartialFailure: () => { if (operation.isCurrent()) notifyPartialFailure() },
      })
      operation.complete(captions)
      if (!operation.isCurrent()) return
      setRoasts(captions)
      setCurrentCaptionIndex(0)

      if (onRoastsGenerated) {
        onRoastsGenerated()
      }
    } catch (error) {
      operation.fail(error)
      if (!operation.isCurrent()) return
      console.error('Error generating jokes:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate jokes.',
      })
    } finally {
      operation.finish()
    }
  }

  const handleUrlUpload = async () => {
    if (!isValidUrl(imageUrl)) {
      toast({
        title: 'Invalid URL',
        description:
          'Please enter a valid image URL. We accept: .jpg, .jpeg, .png, .webp, .heic, .gif',
      })
      return
    }

    // Check if URL has a valid image extension
    if (!hasValidImageExtension(imageUrl)) {
      toast({
        title: 'Invalid Image Type',
        description: `Please enter a URL with one of these image types: 
        ${Array.from(validExtensions).join(', ')}`,
      })
      return
    }

    const operation = generation.begin(imageUrl)

    try {
      const uploadedImageId = await uploadImageFromUrl(imageUrl, false, operation.signal)
      operation.signal.throwIfAborted()
      if (operation.isCurrent()) {
        setImagePreview(imageUrl)
        setImageId(uploadedImageId)
      }
      const captions = await generateCaptions(uploadedImageId, {
        ...operation,
        onPartialFailure: () => { if (operation.isCurrent()) notifyPartialFailure() },
      })
      operation.complete(captions)
      if (!operation.isCurrent()) return
      setRoasts(captions)
      setCurrentCaptionIndex(0)

      if (onRoastsGenerated) {
        onRoastsGenerated()
      }
    } catch (error) {
      operation.fail(error)
      if (!operation.isCurrent()) return
      console.error('Error generating jokes from URL:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate jokes.',
      })
    } finally {
      operation.finish()
    }
  }

  const resetUploader = () => {
    setImageUrl('')
    setImageId(null)
    setImagePreview(null)
    setRoasts([])
    setCurrentCaptionIndex(0)
  }

  const handleContinueBrowsing = () => {
    generation.continueBrowsing()
    resetUploader()
  }

  // Normalize captions to fit Caption type
  type CaptionRow = {
    id: string
    image_id: string
    content: string
    is_public: boolean
    profile_id: string
    humor_flavor_id?: number | null
  }

  const normalizeCaption = (c: CaptionRow): Caption => ({
    id: c.id,
    image_id: c.image_id,
    content: c.content,
    is_public: c.is_public,
    profile_id: c.profile_id,
    humor_flavor_id: c.humor_flavor_id ?? undefined,
  })

  const isCommonImage = (id: string) => {
    if (!id) return false
    return commonUseImages.some((img) => img.id === id)
  }

  const handleCommonImageSelect = async (imageId: string, imageUrl: string) => {
    if (redirectOnSelect) {
      router.push(`/image/${imageId}/captions`)
      return
    }
    const operation = generation.begin(imageUrl)
    const start = Date.now()
    // Clear previous roasts and reset index immediately to prevent showing old captions
    setRoasts([])
    setCurrentCaptionIndex(0)
    setImagePreview(imageUrl)
    setImageId(imageId)

    try {
    // Set number of captions to show this time
      const target = maxCaptions
      let captions: Caption[]

      if (isCommonImage(imageId)) {
        // Fetch existing captions from database (sorted descending by like_count)
        const popularCaptionsRaw = await fetchPopularCaptionsByImageIdAction(imageId)
        operation.signal.throwIfAborted()
        // Normalize caption to fit format for setRoasts()
        const popularCaptionsToSet = (popularCaptionsRaw ?? []).map(normalizeCaption)

        const curPopularCaptions = popularCaptionsToSet

        // Get number of captions for current image
        const numCaptions = curPopularCaptions.length

        // If number of captions for current image >= target number of images,
        // then use existing captions
        // Otherwise, fill remaining slots with newly-generated captions
        if (numCaptions >= target) {
          captions = curPopularCaptions.slice(0, target)
        } else {
          const generatedCaptions = await generateCaptions(imageId, {
            ...operation,
            onPartialFailure: () => { if (operation.isCurrent()) notifyPartialFailure() },
          })
          captions = [...curPopularCaptions.slice(0, target), ...generatedCaptions].slice(0, target)
        }

      } else {
        captions = await generateCaptions(imageId, {
          ...operation,
          onPartialFailure: () => { if (operation.isCurrent()) notifyPartialFailure() },
        })
        captions = captions.slice(0, target)
      }
      operation.complete(captions)
      if (!operation.isCurrent()) return
      setImageId(imageId)
      setRoasts(captions)

      if (onRoastsGenerated) {
        onRoastsGenerated()
      }
    } catch (error) {
      operation.fail(error)
      if (!operation.isCurrent()) return
      console.error('Error generating jokes from common image:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate jokes.',
      })
    } finally {
      const elapsed = Date.now() - start
      // If whole process took less than 2 seconds, make it 2 seconds
      if (elapsed < 2000) {
        await new Promise((res) => setTimeout(res, 2000 - elapsed))
      }
      operation.finish()
    }
  }

  const handleSlideBookmark = (captionId: string) =>
    toggleCaptionSave({
      captionId,
      savedCaptions: bookmarkedCaptions,
      setSavedCaptions: setBookmarkedCaptions,
      toast,
    })
  return (
    <div
      className="w-full max-w-full 
                     px-0 min-h-screen"
    >
      {isLoading && (
        <LoadingScreen
          onContinueBrowsing={handleContinueBrowsing}
          job={generation.progress}
        />
      )}
      <div className="min-h-[600px] flex flex-col">
        {!imagePreview && (
          <div className="w-full px-0">
            {/* Choose your own section */}
            <div className="space-y-2 sm:space-y-3 md:space-y-4 mb-8 mt-4">
              <div className="space-y-3 sm:space-y-4 md:space-y-5">
                <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
                  <Button
                    className="flex-1 h-[36px] sm:h-[40px] md:h-[44px] bg-primary/10
                               backdrop-blur-sm text-primary rounded-3xl hover:bg-primary/20
                               transition-all duration-300 text-xs sm:text-sm md:text-base
                               touch-manipulation border-2 border-primary/50
                               hover:border-primary"
                    onClick={() => {
                      const fileInput = document.querySelector(
                        'input[type="file"]'
                      ) as HTMLInputElement
                      if (fileInput) fileInput.click()
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault()
                      const fileInput = event.dataTransfer.files?.[0]
                      if (fileInput) {
                        handleFileUpload([fileInput])
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">Upload Photo</div>
                  </Button>

                  <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
                    <div className="h-[1px] w-4 sm:w-6 md:w-8 bg-primary/20"></div>
                    <span
                      className="text-[10px] xs:text-xs sm:text-sm md:text-base
                                     text-muted-foreground whitespace-nowrap"
                    >
                      or
                    </span>
                    <div className="h-[1px] w-4 sm:w-6 md:w-8 bg-primary/20"></div>
                  </div>

                  <Button
                    className="flex-1 h-[36px] sm:h-[40px] md:h-[44px] bg-primary/10
                               backdrop-blur-sm text-primary rounded-3xl hover:bg-primary/20
                               transition-all duration-300 text-xs sm:text-sm md:text-base
                               touch-manipulation border-2 border-primary/50
                               hover:border-primary"
                    onClick={() => setIsUrlModalOpen(true)}
                  >
                    <div className="flex items-center gap-2">Enter Link</div>
                  </Button>
                </div>

                <div className="hidden">
                  <FileUpload
                    onChange={handleFileUpload}
                    accept={{
                      'image/*': Array.from(validExtensions),
                    }}
                    multiple={false}
                  />
                </div>
              </div>
            </div>

            {/* Tabs for "Start with a banger" and "Choose from your library" */}
            <div className="space-y-2 sm:space-y-3 md:space-y-4 mb-4">
              <div className="flex border-b border-gray-300/40 dark:border-gray-700/60">
                <button
                  onClick={() => setTab('banger')}
                  className={`px-4 py-2 text-sm sm:text-base font-medium ${
                    tab === 'banger'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-primary/80'
                  }`}
                >
                  Start with a banger
                </button>
                <button
                  onClick={() => setTab('library')}
                  className={`px-4 py-2 text-sm sm:text-base font-medium ${
                    tab === 'library'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-primary/80'
                  }`}
                >
                  Choose from your library
                </button>
              </div>

              {/* Tab content */}
              {tab === 'banger' && (
                <div className="space-y-1 sm:space-y-2">
                  <div
                    className={[
                      'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
                      'mb-4',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-3">
                      <Input
                        value={searchTerm}
                        onChange={(event) => {
                          setSearchTerm(event.target.value)
                          resetCommonImagesPagination()
                        }}
                        placeholder="Search photos"
                        className="h-[40px] max-w-[220px] text-left"
                        aria-label="Search common use photos"
                      />
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 text-sm sm:ml-auto">
                      <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                        <SelectTrigger
                          className="w-[140px] bg-background 
          border border-foreground/10 hover:border-primary/50 
          text-foreground focus:border-primary focus:ring-0 
          focus:ring-offset-0 focus-visible:ring-0 
          focus-visible:ring-offset-0 transition-colors"
                        >
                          <SelectValue placeholder="Filter by" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-foreground/10">
                          <SelectItem
                            value="all"
                            className="focus:bg-primary/10 
            focus:text-primary hover:bg-primary/10 hover:text-primary"
                          >
                            All Photos
                          </SelectItem>
                          {categories.map((category) => (
                            <SelectItem
                              key={category.id}
                              value={category.id.toString()}
                              className="focus:bg-primary/10 focus:text-primary 
                hover:bg-primary/10 hover:text-primary"
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground hidden sm:inline">Show</span>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsItemsDropdownOpen((prev) => !prev)}
                          className="flex h-10 items-center gap-2 bg-background/30 
                            border border-primary/20 rounded-lg px-3 
                            text-sm text-primary hover:border-primary/40 
                            transition-colors duration-200"
                        >
                          {commonUsePageSize}
                          <IconChevronDown className="w-4 h-4" />
                        </button>
                        {isItemsDropdownOpen && (
                          <div
                            className="absolute right-0 mt-2 w-20 bg-background/90 
                              border border-primary/20 rounded-lg shadow-lg 
                              overflow-hidden z-50"
                          >
                            {itemsPerPageOptions.map((value) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => {
                                  handleItemsPerPageChange(value)
                                  setIsItemsDropdownOpen(false)
                                }}
                                className="w-full px-3 py-2 text-sm text-primary 
                                 hover:bg-primary/10 transition-colors 
                                 duration-200 text-left"
                              >
                                {value}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-muted-foreground text-xs sm:text-sm">per page</span>
                    </div>
                  </div>

                  {isInitialCommonImagesLoading ? (
                    <ImageGridSkeleton count={commonUsePageSize} />
                  ) : (
                    <>
                      {commonUseImages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          No photos match your search.
                        </div>
                      ) : (
                        <OptimizedImageGrid
                          images={commonUseImages}
                          onSelect={handleCommonImageSelect}
                          maxConcurrentRequests={8}
                        />
                      )}
                      {commonUseImages.length > 0 && hasMoreCommonImages && (
                        <div className="mt-6 flex justify-center">
                          <button
                            onClick={loadMoreCommonImages}
                            disabled={isLoadingCommonImages}
                            className="bg-primary/10 text-primary border 
                         border-primary/20 px-4 py-2 rounded-lg 
                         text-sm hover:bg-primary/20 transition-colors 
                         duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoadingCommonImages ? 'Loading...' : 'Load More'}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {tab === 'library' && (
                <div className="space-y-1 sm:space-y-2">
                  <div
                    className={[
                      'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
                      'mb-4',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-3">
                      <Input
                        value={librarySearchTerm}
                        onChange={(event) => handleLibrarySearchChange(event.target.value)}
                        placeholder="Search photos"
                        className="h-[40px] max-w-[220px] text-left"
                        aria-label="Search your library"
                      />
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 text-sm">
                      <span className="text-muted-foreground hidden sm:inline">Show</span>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsLibraryDropdownOpen((prev) => !prev)}
                          className="flex h-10 items-center gap-2 bg-background/30 
                            border border-primary/20 rounded-lg px-3 
                            text-sm text-primary hover:border-primary/40 
                            transition-colors duration-200"
                        >
                          {libraryPageSize}
                          <IconChevronDown className="w-4 h-4" />
                        </button>
                        {isLibraryDropdownOpen && (
                          <div
                            className="absolute right-0 mt-2 w-20 bg-background/90 
                              border border-primary/20 rounded-lg shadow-lg 
                              overflow-hidden z-50"
                          >
                            {itemsPerPageOptions.map((value) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => {
                                  handleLibraryItemsPerPageChange(value)
                                  setIsLibraryDropdownOpen(false)
                                }}
                                className="w-full px-3 py-2 text-sm text-primary 
                                 hover:bg-primary/10 transition-colors 
                                 duration-200 text-left"
                              >
                                {value}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-muted-foreground text-xs sm:text-sm">per page</span>
                    </div>
                  </div>

                  {filteredLibraryImages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      {normalizedLibrarySearchTerm
                        ? 'No photos match your search.'
                        : 'No images in your library yet. Upload some images to get started!'}
                    </div>
                  ) : (
                    <>
                      <OptimizedImageGrid
                        images={libraryGridImages}
                        onSelect={handleCommonImageSelect}
                        maxConcurrentRequests={8}
                      />
                      {hasMoreLibraryImages && (
                        <div className="mt-6 flex justify-center">
                          <button
                            onClick={loadMoreLibraryImages}
                            className="bg-primary/10 text-primary border 
                         border-primary/20 px-4 py-2 rounded-lg 
                         text-sm hover:bg-primary/20 transition-colors 
                         duration-200"
                          >
                            Load More
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {imagePreview && imageId && roasts.length === 0 && !isLoading && (
          <div className="mx-auto space-y-3 py-8 text-center">
            <p className="text-muted-foreground">Your image is ready. Check for its captions.</p>
            <Button onClick={() => handleCommonImageSelect(imageId, imagePreview)}>
              Get captions
            </Button>
            <Button variant="outline" onClick={resetUploader} className="ml-2">
              Choose another image
            </Button>
          </div>
        )}
        {roasts.length > 0 && !isLoading && (
          <div className="w-full max-w-[650px] mx-auto px-4">
            <CaptionViewV2
              id={roasts[currentCaptionIndex].id}
              imageUrl={imagePreview || ''}
              content={roasts[currentCaptionIndex].content}
              saved={bookmarkedCaptions.includes(roasts[currentCaptionIndex].id)}
              onSave={handleSlideBookmark}
              shareUrl={buildCaptionShareUrl(roasts[currentCaptionIndex].id)}
              isPublic={roasts[currentCaptionIndex].is_public}
              isOwner={roasts[currentCaptionIndex].profile_id === userId}
              onPrevious={() => setCurrentCaptionIndex(Math.max(0, currentCaptionIndex - 1))}
              onNext={() =>
                setCurrentCaptionIndex(Math.min(roasts.length - 1, currentCaptionIndex + 1))
              }
              hasPrevious={currentCaptionIndex > 0}
              hasNext={currentCaptionIndex < roasts.length - 1}
              currentIndex={currentCaptionIndex}
              totalCount={roasts.length}
            />

            {/* Action Buttons */}
            <div
              className="flex flex-row gap-2 sm:gap-4 justify-center items-center 
                w-full max-w-[650px] mx-auto flex-wrap"
            >
              <button
                onClick={() =>
                  roastAgainUtil({
                    toast,
                    generation,
                    kind: 'start',
                    imagePreview,
                    resetUploader,
                    imageId,
                    setRoasts,
                  })
                }
                className="bg-primary/20 text-primary px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl 
                font-semibold hover:bg-primary/30 transition-colors duration-200 
                flex items-center gap-1.5 sm:gap-2 border border-primary text-sm sm:text-base 
                whitespace-nowrap"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 
                    8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Crack Again</span>
              </button>

              <button
                onClick={resetUploader}
                className="bg-primary/20 text-primary px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl 
                font-semibold hover:bg-primary/30 transition-colors duration-200 
                flex items-center gap-1.5 sm:gap-2 border border-primary text-sm sm:text-base 
                whitespace-nowrap"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
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
                <span>Crack New Image</span>
              </button>
            </div>
          </div>
        )}
        <UrlInputModal
          isOpen={isUrlModalOpen}
          onClose={() => setIsUrlModalOpen(false)}
          onSubmit={handleUrlUpload}
          currentUrl={imageUrl}
          setCurrentUrl={setImageUrl}
        />
      </div>
    </div>
  )
}

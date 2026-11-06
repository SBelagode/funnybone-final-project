'use server'

import { createClient } from '@/utils/supabase/server'

export const fetchCommonUseImagesAction = async (
  categoryId?: number,
  search?: string,
  page = 1,
  pageSize = 8
) => {
  const supabase = await createClient()
  const normalizedSearch = search?.trim() ?? ''
  const sanitizedSearch = normalizedSearch
    .replace(/[(),]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const safeSearch = sanitizedSearch
    .replace(/[^a-zA-Z0-9\s-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const safePage = Math.max(1, page)
  const from = (safePage - 1) * pageSize
  const to = from + pageSize - 1
  const searchFields = ['image_description', 'additional_context', 'celebrity_recognition']
  const fallbackSearchFields = ['image_description']
  const normalizedSearchTerm = safeSearch.toLowerCase()

  const buildSearchFilter = (fields: string[], term: string) =>
    fields.map((field) => `${field}.ilike.%${term}%`).join(',')

  const toSearchValue = (value: unknown) => {
    if (typeof value === 'string') return value
    if (value == null) return ''
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }

  const runImagesQuery = async (
    imageIds?: string[],
    fields: string[] = searchFields,
    useOr = true
  ) => {
    let imagesQuery = supabase
      .from('images')
      .select('id, url', { count: 'exact' })
      .eq('is_common_use', true)

    if (imageIds && imageIds.length > 0) {
      imagesQuery = imagesQuery.in('id', imageIds)
    }

    if (safeSearch) {
      if (useOr && fields.length > 1) {
        imagesQuery = imagesQuery.or(buildSearchFilter(fields, safeSearch))
      } else {
        imagesQuery = imagesQuery.ilike(fields[0], `%${safeSearch}%`)
      }
    }

    return imagesQuery.order('created_datetime_utc', { ascending: false }).range(from, to)
  }

  const runManualSearch = async (imageIds?: string[]) => {
    const manualPageSize = 500
    const manualSelectFields = [
      'id',
      'url',
      'image_description',
      'additional_context',
      'celebrity_recognition',
      'created_datetime_utc',
    ]
    const manualFallbackFields = ['id', 'url', 'image_description', 'created_datetime_utc']

    const fetchAllImages = async (fields: string[]) => {
      let allImages: any[] = []
      let pageIndex = 0

      while (true) {
        let query = supabase
          .from('images')
          .select(fields.join(', '))
          .eq('is_common_use', true)

        if (imageIds && imageIds.length > 0) {
          query = query.in('id', imageIds)
        }

        const { data, error } = await query
          .order('created_datetime_utc', { ascending: false })
          .range(pageIndex * manualPageSize, (pageIndex + 1) * manualPageSize - 1)

        if (error) {
          return { data: null, error }
        }

        if (!data || data.length === 0) {
          break
        }

        allImages = [...allImages, ...data]

        if (data.length < manualPageSize) {
          break
        }

        pageIndex += 1
      }

      return { data: allImages, error: null }
    }

    let { data: allImages, error } = await fetchAllImages(manualSelectFields)
    if (error) {
      console.warn('Manual search fallback failed, retrying with minimal fields:', error.message)
      const fallbackResult = await fetchAllImages(manualFallbackFields)
      allImages = fallbackResult.data
      error = fallbackResult.error
    }

    if (error || !allImages) {
      return { images: [], totalCount: 0, error }
    }

    const filteredImages = allImages.filter((image) => {
      const imageDescription = toSearchValue(image.image_description)
      const additionalContext = toSearchValue(image.additional_context)
      const celebrityRecognition = toSearchValue(image.celebrity_recognition)

      return (
        imageDescription.toLowerCase().includes(normalizedSearchTerm) ||
        additionalContext.toLowerCase().includes(normalizedSearchTerm) ||
        celebrityRecognition.toLowerCase().includes(normalizedSearchTerm)
      )
    })

    return {
      images: filteredImages.slice(from, to + 1),
      totalCount: filteredImages.length,
      error: null,
    }
  }

  const runImagesQueryWithFallback = async (imageIds?: string[]) => {
    const primary = await runImagesQuery(imageIds, searchFields)
    if (!primary.error || !safeSearch) {
      return primary
    }

    console.warn('Falling back to image-description-only search:', primary.error.message)
    const fallback = await runImagesQuery(imageIds, fallbackSearchFields, false)
    return fallback
  }

  const buildResponse = (images: any[], totalCount: number, categoryIdOverride?: number) => ({
    images:
      (images || []).map((image) => ({
        ...image,
        category_id: categoryIdOverride ? categoryIdOverride.toString() : 'unknown',
      })) ?? [],
    totalCount,
  })

  const fetchWithFallbacks = async (imageIds?: string[], categoryIdOverride?: number) => {
    let queryResult: Awaited<ReturnType<typeof runImagesQueryWithFallback>>
    try {
      queryResult = await runImagesQueryWithFallback(imageIds)
    } catch (error) {
      console.warn('Common-use search failed to build query:', error)
      if (safeSearch) {
        const manualResults = await runManualSearch(imageIds)
        if (!manualResults.error) {
          return buildResponse(
            manualResults.images,
            manualResults.totalCount,
            categoryIdOverride
          )
        }
        if (manualResults.error) {
          console.error(
            'Manual common-use search fallback failed:',
            manualResults.error.message
          )
        }
      }
      throw error
    }

    const { data: images, error: imagesError, count } = queryResult

    if (imagesError) {
      console.warn('Primary common-use search failed:', imagesError.message)

      if (safeSearch) {
        const manualResults = await runManualSearch(imageIds)
        if (!manualResults.error) {
          return buildResponse(
            manualResults.images,
            manualResults.totalCount,
            categoryIdOverride
          )
        }
        if (manualResults.error) {
          console.error(
            'Manual common-use search fallback failed:',
            manualResults.error.message
          )
        }
      }

      console.error('Error fetching images:', imagesError.message)
      throw new Error('Failed to fetch images.')
    }

    return buildResponse(images || [], count ?? 0, categoryIdOverride)
  }

  // If categoryId is provided, fetch images for that specific category
  if (categoryId) {
    // Query the 'common_use_category_image_mappings' table to get image_id based on category_id
    const { data: categoryImages, error: categoryImagesError } = await supabase
      .from('common_use_category_image_mappings')
      .select('image_id')
      .eq('common_use_category_id', categoryId)

    if (categoryImagesError) {
      console.error('Error fetching category images:', categoryImagesError.message)
      throw new Error('Failed to fetch category images.')
    }

    // If mappings found, get those specific images
    if (categoryImages && categoryImages.length > 0) {
      // Extract image IDs from the mappings
      const imageIds = categoryImages.map((mapping: any) => mapping.image_id)

      return fetchWithFallbacks(imageIds, categoryId)
    }
  }

  // If no category ID provided or no mappings found for the category,
  // fetch all images that are marked IS_COMMON_USE == TRUE
  return fetchWithFallbacks()
}

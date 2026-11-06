import { fetchSavedCaptionsAction } from '@/app/actions/captions'

// Returns saved caption IDs as strings. Swallows errors and returns []
export async function loadSavedCaptionIds(): Promise<string[]> {
  try {
    const saved = await fetchSavedCaptionsAction()
    return saved.map((c) => c.id.toString())
  } catch (error) {
    console.error('Error loading saved captions:', error)
    return []
  }
}



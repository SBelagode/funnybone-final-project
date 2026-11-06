'use client'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import type { Caption } from '@/utils/types'
import {
  CaptionJobRequestError,
  runCaptionJob,
  type CaptionGenerationOptions,
} from '@/utils/caption-job-client'

interface GeneratePresignedUrlResponse {
  presignedUrl: string
  cdnUrl: string
}

interface UploadImageResponse {
  imageId: string
}

type AuthContext = {
  accessToken: string
  userId: string
}

type TokenPayload = {
  role?: string
  sub?: string
  'https://hasura.io/jwt/claims'?: {
    'x-hasura-role'?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

function decodeJwtPayload(token: string): TokenPayload | null {
  const [, payload] = token.split('.')
  if (!payload) return null
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const decoded = atob(padded)
    return JSON.parse(decoded) as TokenPayload
  } catch {
    return null
  }
}

function assertNonAnonymousToken(token: string) {
  if (!token || !token.includes('.')) {
    throw new Error('Invalid access token format.')
  }

  if (token === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Refusing to use anon key for authenticated requests.')
  }

  const payload = decodeJwtPayload(token)
  const hasuraClaims = payload?.['https://hasura.io/jwt/claims']
  const role = payload?.role ?? hasuraClaims?.['x-hasura-role']
  if (role === 'anon') {
    throw new Error('Anonymous role is not allowed for this action.')
  }
}

async function getAuthContext(signal?: AbortSignal): Promise<AuthContext> {
  const response = await fetch('/api/auth/access-token', {
    method: 'GET',
    signal,
    cache: 'no-store',
    credentials: 'include',
  })

  if (!response.ok) {
    await response.body?.cancel()
    throw new Error(response.status === 401 || response.status === 403
      ? 'Please sign in again to generate captions.'
      : 'Unable to check your session. Please try again.')
  }

  const { accessToken, userId } = (await response.json()) as Partial<AuthContext> & {
    role?: string
  }

  if (!accessToken || !userId) {
    throw new Error('Missing access token or user.')
  }

  assertNonAnonymousToken(accessToken)

  return { accessToken, userId }
}

async function makeRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  body?: Record<string, unknown>,
  accessToken?: string,
  signal?: AbortSignal
): Promise<T> {
  const requestSignal = signal
    ? AbortSignal.any([signal, AbortSignal.timeout(30_000)]) : AbortSignal.timeout(30_000)
  const { accessToken: token } = accessToken
    ? { accessToken } : await getAuthContext(requestSignal)

  assertNonAnonymousToken(token)

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  if (!baseUrl) {
    throw new Error('API base URL is not defined.')
  }

  const url = `${baseUrl}${endpoint}`

  const response = await fetch(url, {
    method,
    signal: requestSignal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`API Error (${endpoint}):`, errorText)
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function generatePresignedUrl(
  contentType: string,
  signal?: AbortSignal
): Promise<GeneratePresignedUrlResponse> {
  return makeRequest<GeneratePresignedUrlResponse>('/pipeline/generate-presigned-url', 'POST', {
    contentType,
  }, undefined, signal)
}

export async function uploadImageFromUrl(
  imageUrl: string,
  isCommonUse: boolean = false,
  signal?: AbortSignal
): Promise<string> {
  const { accessToken, userId } = await getAuthContext(
    signal ? AbortSignal.any([signal, AbortSignal.timeout(30_000)]) : AbortSignal.timeout(30_000)
  )

  if (!userId) {
    throw new Error('User not found.')
  }

  const body = { imageUrl, isCommonUse }

  const response = await makeRequest<UploadImageResponse>(
    '/pipeline/upload-image-from-url',
    'POST',
    body,
    accessToken,
    signal
  )

  if (!response.imageId) {
    throw new Error('imageId not returned from upload-image-from-url')
  }

  return response.imageId
}

export async function generateCaptions(
  imageId: string,
  options: CaptionGenerationOptions = {}
): Promise<Caption[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  if (!apiUrl) throw new Error('API base URL is not defined.')

  return runCaptionJob(imageId, {
    ...options,
    apiUrl,
    getAuth: getAuthContext,
    loadCaptions: async (ids, { accessToken }, signal) => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!url || !key) throw new Error('Supabase is not configured.')
      // Use the same signed-in user's JWT as the job API; RLS still applies.
      const supabase = createClient<Database>(url, key, {
        accessToken: async () => accessToken,
      })
      const captions: Caption[] = []
      for (let offset = 0; offset < ids.length; offset += 100) {
        const { data, error, status } = await supabase.from('captions')
          .select('id,image_id,content,is_public,profile_id,humor_flavor_id')
          .eq('image_id', imageId)
          .in('id', ids.slice(offset, offset + 100))
          .abortSignal(signal)
        if (error) throw new CaptionJobRequestError(status, 'Unable to load generated captions.')
        captions.push(...(data ?? []).map(caption => ({
          ...caption,
          content: caption.content ?? '',
          humor_flavor_id: caption.humor_flavor_id ?? undefined,
        })))
      }
      const byId = new Map(captions.map(caption => [caption.id, caption]))
      if (ids.some(id => !byId.has(id))) {
        throw new Error('Some generated captions could not be loaded. Try this image again.')
      }
      return ids.map(id => byId.get(id)!)
    },
  })
}

export async function uploadImageAndGenerateCaptions(
  imageUrl: string,
  isCommonUse: boolean = false,
  options: CaptionGenerationOptions = {}
): Promise<{ imageId: string; captions: Caption[] }> {
  try {
    options.signal?.throwIfAborted()
    const imageId: string = await uploadImageFromUrl(imageUrl, isCommonUse, options.signal)
    options.signal?.throwIfAborted()

    const captions = await generateCaptions(imageId, options)

    return { imageId, captions }
  } catch (error) {
    console.error('Error in full pipeline execution:', error)
    throw error
  }
}

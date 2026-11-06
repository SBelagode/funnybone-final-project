export type Caption = {
  id: string
  image_id: string
  content: string
  is_public: boolean
  profile_id: string
  humor_flavor_id?: number
}

export type ImageWithCaptions = {
  id: string
  url: string
  captions: Caption[]
  image_description?: string | null
  additional_context?: string | null
  celebrity_recognition?: string | null
}

export type CommonUseCategory = {
  id: number
  name: string
  description: string | null
  created_datetime_utc: string
  modified_datetime_utc: string
}

export type CommonUseImage = {
  id: string
  url: string
}

export type GenerateRoastsProps = {
  onRoastsGenerated?: () => void
  maxCaptions?: number
  redirectOnSelect?: boolean
}

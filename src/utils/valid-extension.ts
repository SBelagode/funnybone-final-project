export const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.gif'] as const
export type ValidImageExt = typeof validExtensions[number]

export function hasValidImageExtension(nameOrUrl: string): boolean {
    const parts = nameOrUrl.toLowerCase().split('?')[0].split('#')[0].split('.')
    const ext = parts.length > 1 ? `.${parts.pop()}` : ''
    return validExtensions.includes(ext as ValidImageExt)
}


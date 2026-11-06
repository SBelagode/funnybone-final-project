export function uploadImageViaSignedUrl(
  file: File,
  signedUrl: string,
  signal?: AbortSignal
): Promise<void> {
  signal?.throwIfAborted()
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const cancel = () => xhr.abort()
    const cleanup = () => signal?.removeEventListener('abort', cancel)
    xhr.open('PUT', signedUrl, true)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.timeout = 120_000
    xhr.onload = () => {
      cleanup()
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Upload failed: ${xhr.status}`))
    }
    xhr.onerror = xhr.ontimeout = () => {
      cleanup()
      reject(new Error('Image upload failed. Please try again.'))
    }
    xhr.onabort = () => {
      cleanup()
      reject(signal?.reason ?? new DOMException('Upload canceled', 'AbortError'))
    }
    signal?.addEventListener('abort', cancel, { once: true })
    xhr.send(file)
  })
}

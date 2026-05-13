export function createFormData(
  fields: Record<string, string | number | File | Date | null | undefined>,
): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined) {
      continue
    }
    if (isFileLike(value)) {
      fd.append(key, value)
      continue
    }
    if (value instanceof Date) {
      const year = value.getUTCFullYear()
      const month = String(value.getUTCMonth() + 1).padStart(2, '0')
      const day = String(value.getUTCDate()).padStart(2, '0')
      fd.append(key, `${year}-${month}-${day}`)
      continue
    }
    fd.append(key, String(value))
  }
  return fd
}

function isFileLike(value: unknown): value is File {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'size' in value &&
    'type' in value
  )
}

export function createPdfFile(name = 'test.pdf'): File {
  const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])
  const padding = new Uint8Array(32)
  const content = new Uint8Array(pdfHeader.length + padding.length)
  content.set(pdfHeader)
  content.set(padding, pdfHeader.length)
  return new File([content], name, { type: 'application/pdf' })
}

export function createPngFile(name = 'test.png'): File {
  const pngHeader = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ])
  const padding = new Uint8Array(24)
  const content = new Uint8Array(pngHeader.length + padding.length)
  content.set(pngHeader)
  content.set(padding, pngHeader.length)
  return new File([content], name, { type: 'image/png' })
}

export function createJpegFile(name = 'test.jpg'): File {
  const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff])
  const padding = new Uint8Array(32)
  const content = new Uint8Array(jpegHeader.length + padding.length)
  content.set(jpegHeader)
  content.set(padding, jpegHeader.length)
  return new File([content], name, { type: 'image/jpeg' })
}

export function createGifFile(name = 'test.gif'): File {
  const gifHeader = new Uint8Array(
    'GIF89a'.split('').map((ch) => ch.charCodeAt(0)),
  )
  const padding = new Uint8Array(32)
  const content = new Uint8Array(gifHeader.length + padding.length)
  content.set(gifHeader)
  content.set(padding, gifHeader.length)
  return new File([content], name, { type: 'image/gif' })
}

export function createWebpFile(name = 'test.webp'): File {
  const header = new Uint8Array(32)
  const riff = 'RIFF'.split('').map((ch) => ch.charCodeAt(0))
  const webp = 'WEBP'.split('').map((ch) => ch.charCodeAt(0))
  riff.forEach((byte, i) => {
    header[i] = byte
  })
  webp.forEach((byte, i) => {
    header[8 + i] = byte
  })
  return new File([header], name, { type: 'image/webp' })
}

export function createSvgFile(name = 'test.svg'): File {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>'
  return new File([svg], name, { type: 'image/svg+xml' })
}

export function createInvalidFile(name = 'bad.png', type = 'image/png'): File {
  const garbage = new Uint8Array(32)
  garbage.fill(0x42)
  return new File([garbage], name, { type })
}

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { File as NodeFile, Blob as NodeBlob } from 'node:buffer'
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { mockClient } from 'aws-sdk-client-mock'

// jsdom Blob.slice().arrayBuffer() is unimplemented; use Node's native File/Blob
// so src/utils/s3.ts byte-sniffing works the same as in Next.js runtime.
globalThis.File = NodeFile as unknown as typeof File
globalThis.Blob = NodeBlob as unknown as typeof Blob

function makePng(name = 'test.png'): File {
  const pngHeader = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ])
  const padded = new Uint8Array(32)
  padded.set(pngHeader)
  return new File([padded], name, { type: 'image/png' })
}

function makeJpeg(name = 'test.jpg'): File {
  const header = new Uint8Array([0xff, 0xd8, 0xff])
  const padded = new Uint8Array(32)
  padded.set(header)
  return new File([padded], name, { type: 'image/jpeg' })
}

function makeGif(name = 'test.gif'): File {
  const header = new Uint8Array(
    'GIF89a'.split('').map((ch) => ch.charCodeAt(0)),
  )
  const padded = new Uint8Array(32)
  padded.set(header)
  return new File([padded], name, { type: 'image/gif' })
}

function makeWebp(name = 'test.webp'): File {
  const bytes = new Uint8Array(32)
  'RIFF'.split('').forEach((ch, i) => {
    bytes[i] = ch.charCodeAt(0)
  })
  'WEBP'.split('').forEach((ch, i) => {
    bytes[8 + i] = ch.charCodeAt(0)
  })
  return new File([bytes], name, { type: 'image/webp' })
}

function makeSvg(name = 'test.svg'): File {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>'
  const bytes = new Uint8Array(svg.split('').map((ch) => ch.charCodeAt(0)))
  return new File([bytes], name, { type: 'image/svg+xml' })
}

function makePdf(name = 'test.pdf'): File {
  const header = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])
  const padded = new Uint8Array(32)
  padded.set(header)
  return new File([padded], name, { type: 'application/pdf' })
}

const s3Mock = mockClient(S3Client)

function resetMock() {
  s3Mock.reset()
  s3Mock.on(PutObjectCommand).resolves({})
  s3Mock.on(DeleteObjectCommand).resolves({})
}

async function loadS3Module() {
  vi.resetModules()
  vi.doUnmock('@/utils/s3')
  return import('@/utils/s3')
}

describe('uploadAsset - images', () => {
  beforeEach(() => {
    resetMock()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uploads PNG file and resolves with expected metadata', async () => {
    const { uploadAsset } = await loadS3Module()
    const result = await uploadAsset(makePng('logo.png'), 'images')
    expect(result.prefix).toBe('images')
    expect(result.mimeType).toBe('image/png')
    expect(result.filename).toBe('logo.png')
    expect(result.url).toMatch(
      /^https:\/\/stdev-kr\.s3\.ap-northeast-2\.amazonaws\.com\/images\/\d+-logo\.png$/,
    )
  })

  it('sends PutObjectCommand with correct bucket, Key, Body, ContentType', async () => {
    const { uploadAsset } = await loadS3Module()
    await uploadAsset(makePng('a.png'), 'images')
    const calls = s3Mock.commandCalls(PutObjectCommand)
    expect(calls).toHaveLength(1)
    const input = calls[0].args[0].input
    expect(input.Bucket).toBe('stdev-kr')
    expect(input.Key).toMatch(/^images\/\d+-a\.png$/)
    expect(input.Body).toBeInstanceOf(Buffer)
    expect(input.ContentType).toBe('image/png')
  })

  it('uploads JPEG file', async () => {
    const { uploadAsset } = await loadS3Module()
    const result = await uploadAsset(makeJpeg('p.jpg'), 'images')
    expect(result.mimeType).toBe('image/jpeg')
    expect(result.url).toContain('/images/')
  })

  it('uploads GIF file', async () => {
    const { uploadAsset } = await loadS3Module()
    const result = await uploadAsset(makeGif('anim.gif'), 'images')
    expect(result.mimeType).toBe('image/gif')
  })

  it('uploads WebP file', async () => {
    const { uploadAsset } = await loadS3Module()
    const result = await uploadAsset(makeWebp('pic.webp'), 'images')
    expect(result.mimeType).toBe('image/webp')
  })

  it('uploads SVG file', async () => {
    const { uploadAsset } = await loadS3Module()
    const result = await uploadAsset(makeSvg('icon.svg'), 'images')
    expect(result.mimeType).toBe('image/svg+xml')
  })

  it('sanitizes filenames with spaces and special chars into dashes', async () => {
    const { uploadAsset } = await loadS3Module()
    const file = makePng('my file (v2)!.png')
    const result = await uploadAsset(file, 'images')
    expect(result.filename).not.toContain(' ')
    expect(result.filename).not.toContain('(')
    expect(result.filename).toMatch(/^[a-zA-Z0-9._-]+$/)
  })

  it('rejects non-image MIME type for images prefix', async () => {
    const { uploadAsset } = await loadS3Module()
    const file = new File(['hello'], 'a.txt', { type: 'text/plain' })
    await expect(uploadAsset(file, 'images')).rejects.toThrow(
      '이미지 업로드는 image/* 타입만 지원합니다.',
    )
    expect(s3Mock.commandCalls(PutObjectCommand)).toHaveLength(0)
  })

  it('rejects invalid image file bytes', async () => {
    const { uploadAsset } = await loadS3Module()
    const garbage = new Uint8Array(32)
    garbage.fill(0x42)
    const file = new File([garbage], 'bad.png', { type: 'image/png' })
    await expect(uploadAsset(file, 'images')).rejects.toThrow(
      '업로드 파일 내용이 유효한 이미지가 아닙니다.',
    )
  })

  it('accepts image file whose type is empty but bytes are valid PNG', async () => {
    const { uploadAsset } = await loadS3Module()
    const header = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ])
    const padded = new Uint8Array(32)
    padded.set(header)
    const file = new File([padded], 'unknown.png', { type: '' })
    const result = await uploadAsset(file, 'images')
    expect(result.mimeType).toBeNull()
  })
})

describe('uploadAsset - files (PDF)', () => {
  beforeEach(() => {
    resetMock()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uploads a valid PDF and resolves metadata', async () => {
    const { uploadAsset } = await loadS3Module()
    const result = await uploadAsset(makePdf('report.pdf'), 'files')
    expect(result.prefix).toBe('files')
    expect(result.mimeType).toBe('application/pdf')
    expect(result.filename).toBe('report.pdf')
    expect(result.url).toMatch(
      /^https:\/\/stdev-kr\.s3\.ap-northeast-2\.amazonaws\.com\/files\/\d+-report\.pdf$/,
    )
  })

  it('rejects when file.type is not application/pdf', async () => {
    const { uploadAsset } = await loadS3Module()
    const file = new File(['hello'], 'r.pdf', { type: 'text/plain' })
    await expect(uploadAsset(file, 'files')).rejects.toThrow(
      '파일 업로드는 PDF만 지원합니다.',
    )
    expect(s3Mock.commandCalls(PutObjectCommand)).toHaveLength(0)
  })

  it('rejects when filename does not end with .pdf', async () => {
    const { uploadAsset } = await loadS3Module()
    const file = new File(['x'], 'r.doc', { type: 'application/pdf' })
    await expect(uploadAsset(file, 'files')).rejects.toThrow(
      '업로드 파일 이름은 .pdf 확장자를 가져야 합니다.',
    )
  })

  it('rejects when PDF header is invalid', async () => {
    const { uploadAsset } = await loadS3Module()
    const garbage = new Uint8Array(16)
    garbage.fill(0x00)
    const file = new File([garbage], 'fake.pdf', {
      type: 'application/pdf',
    })
    await expect(uploadAsset(file, 'files')).rejects.toThrow(
      '업로드 파일 내용이 유효한 PDF가 아닙니다.',
    )
  })

  it('sanitizes filename for files prefix', async () => {
    const { uploadAsset } = await loadS3Module()
    const header = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])
    const padded = new Uint8Array(32)
    padded.set(header)
    const file = new File([padded], '2026 Q1 회의록.pdf', {
      type: 'application/pdf',
    })
    const result = await uploadAsset(file, 'files')
    expect(result.filename).toMatch(/^[a-zA-Z0-9._-]+$/)
    expect(result.filename.toLowerCase().endsWith('.pdf')).toBe(true)
  })
})

describe('uploadAsset - env var handling', () => {
  beforeEach(() => {
    resetMock()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('throws when AWS_ACCESS_KEY is missing', async () => {
    vi.stubEnv('AWS_ACCESS_KEY', '')
    const { uploadAsset } = await loadS3Module()
    await expect(uploadAsset(makePng('x.png'), 'images')).rejects.toThrow(
      'AWS_ACCESS_KEY is required for S3 operations',
    )
  })

  it('throws when AWS_SECRET_KEY is missing', async () => {
    vi.stubEnv('AWS_SECRET_KEY', '')
    const { uploadAsset } = await loadS3Module()
    await expect(uploadAsset(makePng('x.png'), 'images')).rejects.toThrow(
      'AWS_SECRET_KEY is required for S3 operations',
    )
  })

  it('uses custom PAYLOAD_S3_TARGET_BUCKET and AWS_REGION in returned URL', async () => {
    vi.stubEnv('PAYLOAD_S3_TARGET_BUCKET', 'my-bucket')
    vi.stubEnv('AWS_REGION', 'us-east-1')
    const { uploadAsset } = await loadS3Module()
    const result = await uploadAsset(makePng('p.png'), 'images')
    expect(result.url).toMatch(
      /^https:\/\/my-bucket\.s3\.us-east-1\.amazonaws\.com\/images\//,
    )
  })
})

describe('deleteManagedAsset', () => {
  beforeEach(() => {
    resetMock()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('is a no-op when url is null', async () => {
    const { deleteManagedAsset } = await loadS3Module()
    await deleteManagedAsset(null)
    expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(0)
  })

  it('is a no-op when url is undefined', async () => {
    const { deleteManagedAsset } = await loadS3Module()
    await deleteManagedAsset(undefined)
    expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(0)
  })

  it('is a no-op when url is an empty string', async () => {
    const { deleteManagedAsset } = await loadS3Module()
    await deleteManagedAsset('')
    expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(0)
  })

  it('sends DeleteObjectCommand with correct Bucket and Key for managed URL', async () => {
    const { deleteManagedAsset } = await loadS3Module()
    await deleteManagedAsset(
      'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/images/logo.png',
    )
    const calls = s3Mock.commandCalls(DeleteObjectCommand)
    expect(calls).toHaveLength(1)
    const input = calls[0].args[0].input
    expect(input.Bucket).toBe('stdev-kr')
    expect(input.Key).toBe('images/logo.png')
  })

  it('is a no-op for external host URLs', async () => {
    const { deleteManagedAsset } = await loadS3Module()
    await deleteManagedAsset('https://other.example.com/images/logo.png')
    expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(0)
  })

  it('is a no-op when managed URL has no pathname (root only)', async () => {
    const { deleteManagedAsset } = await loadS3Module()
    await deleteManagedAsset(
      'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/',
    )
    expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(0)
  })

  it('uses custom PAYLOAD_S3_TARGET_BUCKET and AWS_REGION for host matching', async () => {
    vi.stubEnv('PAYLOAD_S3_TARGET_BUCKET', 'custom-bucket')
    vi.stubEnv('AWS_REGION', 'us-east-1')
    const { deleteManagedAsset } = await loadS3Module()
    await deleteManagedAsset(
      'https://custom-bucket.s3.us-east-1.amazonaws.com/files/x.pdf',
    )
    const calls = s3Mock.commandCalls(DeleteObjectCommand)
    expect(calls).toHaveLength(1)
    expect(calls[0].args[0].input.Bucket).toBe('custom-bucket')
    expect(calls[0].args[0].input.Key).toBe('files/x.pdf')
  })

  it('strips the leading slash from pathname when computing Key', async () => {
    const { deleteManagedAsset } = await loadS3Module()
    await deleteManagedAsset(
      'https://stdev-kr.s3.ap-northeast-2.amazonaws.com/nested/path/to/file.pdf',
    )
    const calls = s3Mock.commandCalls(DeleteObjectCommand)
    expect(calls).toHaveLength(1)
    expect(calls[0].args[0].input.Key).toBe('nested/path/to/file.pdf')
  })
})

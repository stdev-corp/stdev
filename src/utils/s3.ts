import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

const region = process.env.AWS_REGION ?? 'ap-northeast-2'
const bucket = process.env.PAYLOAD_S3_TARGET_BUCKET ?? 'stdev-kr'

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is required for S3 operations`)
  }
  return value
}

function s3Client() {
  return new S3Client({
    region,
    credentials: {
      accessKeyId: requiredEnv('AWS_ACCESS_KEY'),
      secretAccessKey: requiredEnv('AWS_SECRET_KEY'),
    },
  })
}

function safeName(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '-')
}

function normalizeFilename(prefix: 'images' | 'files', filename: string) {
  const safeFilename = safeName(filename)

  if (prefix === 'files' && !safeFilename.toLowerCase().endsWith('.pdf')) {
    return `${safeFilename}.pdf`
  }

  return safeFilename
}

async function assertPdfFile(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 5).arrayBuffer())
  const signature = Array.from(bytes)
    .map((byte) => String.fromCharCode(byte))
    .join('')

  if (signature !== '%PDF-') {
    throw new Error('업로드 파일 내용이 유효한 PDF가 아닙니다.')
  }
}

async function assertImageFile(file: File) {
  if (file.type && !file.type.startsWith('image/')) {
    throw new Error('이미지 업로드는 image/* 타입만 지원합니다.')
  }

  const bytes = new Uint8Array(await file.slice(0, 32).arrayBuffer())
  const ascii = Array.from(bytes)
    .map((byte) => String.fromCharCode(byte))
    .join('')
  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  const isGif = ascii.startsWith('GIF87a') || ascii.startsWith('GIF89a')
  const isWebp = ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP'
  const isSvg = ascii.includes('<svg') || ascii.includes('<?xml')

  if (!(isPng || isJpeg || isGif || isWebp || isSvg)) {
    throw new Error('업로드 파일 내용이 유효한 이미지가 아닙니다.')
  }
}

export async function uploadAsset(
  file: File,
  prefix: 'images' | 'files',
) {
  if (prefix === 'images') {
    await assertImageFile(file)
  }

  if (prefix === 'files' && file.type && file.type !== 'application/pdf') {
    throw new Error('파일 업로드는 PDF만 지원합니다.')
  }

  if (prefix === 'files' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('업로드 파일 이름은 .pdf 확장자를 가져야 합니다.')
  }

  if (prefix === 'files') {
    await assertPdfFile(file)
  }

  const client = s3Client()
  const filename = normalizeFilename(prefix, file.name)
  const key = `${prefix}/${Date.now()}-${filename}`

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type || undefined,
    }),
  )

  return {
    url: `https://${bucket}.s3.${region}.amazonaws.com/${key}`,
    filename,
    mimeType: file.type || null,
    prefix,
  }
}

export async function deleteManagedAsset(url: string | null | undefined) {
  if (!url) {
    return
  }

  const parsed = new URL(url)
  const expectedHost = `${bucket}.s3.${region}.amazonaws.com`

  if (parsed.hostname !== expectedHost) {
    return
  }

  const key = parsed.pathname.replace(/^\//, '')
  if (!key) {
    return
  }

  const client = s3Client()
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  )
}

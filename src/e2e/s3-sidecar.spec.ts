import { test, expect } from '@playwright/test'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { deleteManagedAsset, uploadAsset } from '../utils/s3'

// 1x1 transparent PNG
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

// Runs the app's own S3 helpers against the sidecar from
// docker-compose.test.yml. No browser spec uploads anything (admin CRUD smoke
// only checks the dashboard headings), so without this the sidecar only had to
// pass its healthcheck and a server that rejects the app's writes would go
// unnoticed.
test.describe('S3 sidecar', () => {
  test('uploadAsset stores an object that deleteManagedAsset removes', async () => {
    // dotenv does not override variables already exported in the shell, so
    // check the endpoint really is the local sidecar before writing anything.
    const endpoint = process.env.AWS_ENDPOINT_URL_S3 ?? ''
    const endpointHost = URL.canParse(endpoint)
      ? new URL(endpoint).hostname
      : ''
    expect(
      ['127.0.0.1', 'localhost', '[::1]'],
      'AWS_ENDPOINT_URL_S3 must point at the local sidecar, never real S3',
    ).toContain(endpointHost)

    // Built like the client in src/utils/s3.ts, used only to inspect the bucket.
    const client = new S3Client({
      region: process.env.AWS_REGION ?? 'ap-northeast-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY ?? '',
        secretAccessKey: process.env.AWS_SECRET_KEY ?? '',
      },
      endpoint,
      forcePathStyle: true,
    })
    const bucket = process.env.S3_BUCKET ?? 'stdev-kr'

    const asset = await uploadAsset(
      new File([png], 'e2e smoke.png', { type: 'image/png' }),
      'images',
    )
    const key = new URL(asset.url).pathname.slice(1)
    expect(key).toMatch(/^images\/\d+-e2e-smoke\.png$/)

    const stored = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    )
    expect(stored.ContentType).toBe('image/png')
    expect(Buffer.from(await stored.Body!.transformToByteArray())).toEqual(png)

    await deleteManagedAsset(asset.url)

    const afterDelete = await client
      .send(new GetObjectCommand({ Bucket: bucket, Key: key }))
      .then(
        () => 'still there',
        (error: Error) => error.name,
      )
    expect(afterDelete).toBe('NoSuchKey')
  })
})

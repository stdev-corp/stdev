import { vi } from 'vitest'
import { mockClient } from 'aws-sdk-client-mock'
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

export const s3Mock = mockClient(S3Client)

export function resetS3Mock() {
  s3Mock.reset()
  s3Mock.on(PutObjectCommand).resolves({})
  s3Mock.on(DeleteObjectCommand).resolves({})
}

resetS3Mock()

export const mockedUploadAsset = vi.fn()
export const mockedDeleteManagedAsset = vi.fn()

vi.mock('@/utils/s3', () => ({
  uploadAsset: mockedUploadAsset,
  deleteManagedAsset: mockedDeleteManagedAsset,
}))

export function resetS3ModuleMock() {
  mockedUploadAsset.mockReset()
  mockedDeleteManagedAsset.mockReset()
}

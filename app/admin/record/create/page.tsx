import { Input } from '@heroui/input'
import { Button } from '@heroui/button'
import { DateInput } from '@heroui/date-input'
import RecordTypeSelect from './record-type-select'
import { createRecord } from '@/utils/server/records'
import { RecordType } from '@prisma/client'
import { redirect } from 'next/navigation'
import { Links } from '@/utils/links'

export default async function AdminRecordCreatePage() {
  async function handleCreate(formData: FormData) {
    'use server'
    const title = formData.get('title') as string
    const date = formData.get('date') as string
    const pdfUrl = formData.get('pdfUrl') as string
    const type = formData.get('recordType') as RecordType

    await createRecord({
      title,
      date: new Date(date),
      pdfUrl,
      type,
    })

    redirect(Links.adminRecord)
  }

  return (
    <>
      <h1>새 문서 만들기</h1>
      <form>
        <Input label="문서 제목" name="title" />
        <div className="h-4" />
        <DateInput label="게시 날짜" name="date" />
        <div className="h-4" />
        <Input label="AWS S3 PDF URL" name="pdfUrl" />
        <div className="h-4" />
        <RecordTypeSelect />
        <div className="h-4" />
        <Button type="submit" formAction={handleCreate}>
          생성
        </Button>
      </form>
    </>
  )
}

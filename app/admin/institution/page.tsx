import { Links } from '@/utils/links'
import { queryInstitutions } from '@/utils/server/institutions'
import { Button } from '@nextui-org/button'
import Link from 'next/link'
import InstitutionTable from './table'

export default async function AdminInstitutionPage() {
  const institutions = await queryInstitutions()

  return (
    <>
      <h1>기관</h1>
      <Button href={Links.adminInstitutionCreate} as={Link}>
        기관 생성
      </Button>
      <div className="h-12" />
      <InstitutionTable institutions={institutions} />
    </>
  )
}

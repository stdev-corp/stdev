import { Card, CardBody, CardFooter, CardHeader } from '@nextui-org/card'
import { Divider } from '@nextui-org/divider'
import { Button } from '@nextui-org/button'
import Link from 'next/link'
import { ReactNode } from 'react'
import Image from 'next/image'
import { Links } from '@/utils/links'
import { getUserCount } from '@/utils/server/user'

type AdminCardProps = {
  title: string
  children: ReactNode
  href: string
  openInNewTab?: boolean
}

function AdminCard(props: AdminCardProps) {
  return (
    <Card className="max-w-xs">
      <CardHeader className="font-bold">{props.title}</CardHeader>
      <Divider />
      <CardBody>{props.children}</CardBody>
      <Divider />
      <CardFooter>
        <Button
          size="sm"
          as={Link}
          href={props.href}
          target={props.openInNewTab ? '_blank' : undefined}
        >
          바로가기
        </Button>
      </CardFooter>
    </Card>
  )
}

export default async function AdminPage() {
  const userCount = await getUserCount()

  return (
    <>
      <h1 className="text-2xl mb-8 font-bold">STDev Corp. Dashboard</h1>
      <div className="w-full grid columns-3xs gap-4">
        <AdminCard
          title="AWS Console"
          href="https://stdev.awsapps.com/start"
          openInNewTab
        >
          <Image
            src="/images/admin/aws.png"
            alt="AWS Logo"
            width={100}
            height={100}
          />
        </AdminCard>
        <AdminCard title="사용자" href={Links.adminUser}>
          <p>전체 사용자: {userCount.all}명</p>
          <p>법인 사용자: {userCount.corporation}명</p>
        </AdminCard>
      </div>
    </>
  )
}

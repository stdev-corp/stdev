import { Links } from '@/utils/links'
import { Card, CardBody, CardFooter, CardHeader } from '@nextui-org/card'
import { Button } from '@nextui-org/button'
import Link from 'next/link'
import { ReactNode } from 'react'
import { Divider } from '@nextui-org/divider'

type Props = {
  title: string
  children: ReactNode
}

export default async function CenterScreen(props: Props) {
  return (
    <div className="flex justify-center items-center h-screen">
      <Card>
        <CardHeader className="text-4xl font-bold m-4">
          {props.title}
        </CardHeader>
        <Divider />
        <CardBody className="m-4">{props.children}</CardBody>
        <Divider />
        <CardFooter className="m-4">
          <Button
            as={Link}
            href={Links.root}
            color="primary"
            className="text-white"
          >
            홈페이지로 돌아가기
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

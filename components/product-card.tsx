import { Card, CardBody, CardFooter, CardHeader } from '@heroui/card'
import { Divider } from '@heroui/divider'
import Image from 'next/image'
import { Product } from '@prisma/client'
import { Button } from '@heroui/button'
import Link from 'next/link'
import { Links } from '@/utils/links'

type ProductCardProps = {
  product: Pick<Product, 'id' | 'name' | 'description' | 'price'>
  isButton: boolean
}

export default function ProductCard(props: ProductCardProps) {
  return (
    <Card className="max-w-[360px]">
      <CardHeader>
        <span className="font-bold text-2xl">{props.product.name}</span>
      </CardHeader>
      <Divider />
      <CardBody>
        <Image
          src="https://stdev-kr.s3.ap-northeast-2.amazonaws.com/conference.jpg"
          alt="STDev Conference 2025"
          width={500}
          height={300}
          className="rounded-md"
        />
        <div className="h-4" />
        <span className="whitespace-pre-line">{props.product.description}</span>
      </CardBody>
      <Divider />
      <CardFooter>
        {props.isButton ? (
          <Button
            color="primary"
            className="text-white"
            as={Link}
            href={Links.checkoutUserInfo(props.product.id)}
          >
            ₩ {props.product.price}원
          </Button>
        ) : (
          <span>₩ {props.product.price}원</span>
        )}
      </CardFooter>
    </Card>
  )
}

import { Card, CardBody, CardFooter, CardHeader } from '@heroui/card'
import { Divider } from '@heroui/divider'
import Image from 'next/image'
import { Product } from '@prisma/client'
import { Button } from '@heroui/button'
import Link from 'next/link'
import { Links } from '@/utils/links'

type ProductCardProps = {
  product: Pick<Product, 'id' | 'name' | 'description' | 'price' | 'image'>
  isButton: boolean
}

export default function ProductCard(props: ProductCardProps) {
  return (
    <Card className="max-w-[420px]">
      <CardHeader>
        <span className="font-bold text-2xl">{props.product.name}</span>
      </CardHeader>
      <Divider />
      <CardBody>
        <Image
          src={props.product.image}
          alt={props.product.name}
          width={500}
          height={300}
          className="rounded-md"
        />
        <div className="h-4" />
        {props.isButton ? (
          <Button
            color="primary"
            className="text-white"
            as={Link}
            size="lg"
            href={Links.checkoutUserInfo(props.product.id)}
          >
            ₩ {props.product.price}원
          </Button>
        ) : (
          <span className="font-bold text-2xl">₩ {props.product.price}원</span>
        )}
      </CardBody>
      <Divider />
      <CardFooter>
        <span className="whitespace-pre-line">{props.product.description}</span>
      </CardFooter>
    </Card>
  )
}

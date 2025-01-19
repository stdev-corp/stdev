'use client'
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/table'
import { Product } from '@prisma/client'
import Link from 'next/link'

type Props = {
  products: Product[]
}

export default function ProductTable(props: Props) {
  return (
    <Table>
      <TableHeader>
        <TableColumn>상품 이름</TableColumn>
        <TableColumn>설명</TableColumn>
        <TableColumn>가격</TableColumn>
        <TableColumn>이미지 URL</TableColumn>
      </TableHeader>
      <TableBody>
        {props.products.map((product) => (
          <TableRow key={product.id}>
            <TableCell>{product.name}</TableCell>
            <TableCell>{product.description}</TableCell>
            <TableCell>{product.price}원</TableCell>
            <TableCell>
              <Link href={product.image} target="_blank">
                {product.image}
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

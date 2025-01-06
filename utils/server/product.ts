import { prisma } from '../prisma'

export async function queryProducts() {
  const data = await prisma.product.findMany()
  return data
}

type CreateProductInput = {
  name: string
  description: string
  price: number
  image: string
}

export async function createProduct(data: CreateProductInput) {
  const product = await prisma.product.create({
    data,
  })
  return product
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      price: true,
    },
  })
  return product
}

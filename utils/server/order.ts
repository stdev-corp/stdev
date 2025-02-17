import { OrderStatus } from '@prisma/client'
import { prisma } from '../prisma'
import { redirect } from 'next/navigation'
import { Links } from '../links'

const secretKey = process.env.TOSS_SECRET_KEY

if (secretKey === undefined) {
  throw new Error('TOSS_SECRET_KEY is not defined')
}

export async function getOrders(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: { product: true },
  })
  return orders
}

type CreateOrderInput = {
  productId: string
  userId: string
  name: string
  email: string
  phone: string
  affiliation: string
  position: string
}

export async function createOrder(data: CreateOrderInput) {
  const order = await prisma.order.create({
    data,
  })
  return order
}

export async function getOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  })
  return order
}

export async function confirmOrder(
  orderId: string,
  paymentKey: string,
  amount: number,
) {
  const widgetSecretKey = secretKey
  const encryptedSecretKey =
    'Basic ' + Buffer.from(widgetSecretKey + ':').toString('base64')

  const res = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: encryptedSecretKey,
      'Content-Type': 'application/json',
      'Response-Type': 'application/json',
    },
    body: JSON.stringify({
      orderId,
      amount,
      paymentKey,
    }),
  })

  const json = await res.json()

  if (res.status !== 200) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.FAILED, paymentKey },
    })
    redirect(Links.checkoutFailWithParams(json.code, json.message))
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { paymentKey, status: OrderStatus.SUCCESS, paymentInfo: json },
  })
  return order
}

export async function queryMyOrders(
  name: string,
  email: string,
  phone: string,
) {
  const orders = await prisma.order.findMany({
    where: { name, email, phone },
  })
  return orders
}

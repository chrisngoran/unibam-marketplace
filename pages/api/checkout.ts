import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'

const stripeKey = process.env.STRIPE_SECRET || ''
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2022-11-15' }) : null
const prisma = new PrismaClient()

async function createOrderFromCart(cartId: string, userId?: string | null) {
  const cart = await prisma.cart.findUnique({ where: { id: cartId }, include: { items: true } })
  if (!cart || !cart.items || cart.items.length === 0) throw new Error('Cart empty')

  const total = cart.items.reduce((sum, item) => sum + (item.priceCents || 0) * item.qty, 0)
  const order = await prisma.order.create({ data: { userId: userId || null, totalCents: total } })

  await prisma.orderItem.createMany({
    data: cart.items.map(item => ({
      orderId: order.id,
      productId: item.productId,
      qty: item.qty,
      title: item.title || undefined,
      priceCents: item.priceCents || 0,
    })),
  })

  await prisma.cartItem.deleteMany({ where: { cartId } })
  await prisma.cart.delete({ where: { id: cartId } })

  return order
}

async function createOrderFromProduct(productId: string, userId?: string | null) {
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) throw new Error('Product not found')

  const order = await prisma.order.create({ data: { userId: userId || null, totalCents: product.priceCents } })
  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      productId: product.id,
      qty: 1,
      title: product.title,
      priceCents: product.priceCents,
    },
  })
  return order
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { cartId, productId, userId } = req.body

  if (!stripe) {
    try {
      if (cartId) {
        const order = await createOrderFromCart(cartId, userId)
        return res.status(200).json({ url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/checkout/success?orderId=${order.id}`, mock: true })
      }

      if (!productId) return res.status(400).json({ error: 'Missing productId' })
      const order = await createOrderFromProduct(productId, userId)
      return res.status(200).json({ url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/checkout/success?orderId=${order.id}`, mock: true })
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Unable to create order' })
    }
  }

  const lineItems = [] as any[]
  let metadata: Record<string, string> = {}

  if (cartId) {
    const cart = await prisma.cart.findUnique({ where: { id: cartId }, include: { items: true } })
    if (!cart || !cart.items || cart.items.length === 0) return res.status(400).json({ error: 'Cart empty' })
    metadata = { cartId: cart.id }
    for (const item of cart.items) {
      const name = item.title || 'Item'
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name, description: `Quantity: ${item.qty}` },
          unit_amount: item.priceCents || 0,
        },
        quantity: item.qty,
      })
    }
  } else {
    if (!productId) return res.status(400).json({ error: 'Missing productId' })
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) return res.status(404).json({ error: 'Product not found' })
    metadata = { productId: product.id }
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: product.title, description: product.description || undefined },
        unit_amount: product.priceCents,
      },
      quantity: 1,
    })
  }

  if (userId) {
    metadata.userId = userId
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: lineItems,
    success_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/cart`,
    metadata,
  })

  res.status(200).json({ url: session.url })
}

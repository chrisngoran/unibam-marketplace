import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'

const stripeKey = process.env.STRIPE_SECRET || ''
const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  if (!stripeKey) return res.status(500).json({ error: 'Stripe is not configured' })

  const stripe = new Stripe(stripeKey, { apiVersion: '2022-11-15' })
  const { sessionId } = req.query as any
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' })

  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items'] })
  if (session.payment_status !== 'paid') {
    return res.status(400).json({ error: 'Payment not yet completed' })
  }

  const existing = await prisma.order.findUnique({ where: { stripeSessionId: sessionId } })
  if (existing) return res.json(existing)

  const metadata = session.metadata || {}
  const userId = metadata.userId || null
  let order: any = null

  if (metadata.cartId) {
    const cart = await prisma.cart.findUnique({ where: { id: metadata.cartId }, include: { items: true } })
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart not found or empty' })
    }
    const total = cart.items.reduce((sum, item) => sum + (item.priceCents || 0) * item.qty, 0)
    order = await prisma.order.create({
      data: {
        userId,
        totalCents: total,
        status: 'paid',
        stripeSessionId: sessionId,
      },
    })
    await prisma.orderItem.createMany({
      data: cart.items.map(item => ({
        orderId: order.id,
        productId: item.productId,
        qty: item.qty,
        title: item.title || undefined,
        priceCents: item.priceCents || 0,
      })),
    })
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    await prisma.cart.delete({ where: { id: cart.id } })
  } else if (metadata.productId) {
    const product = await prisma.product.findUnique({ where: { id: metadata.productId } })
    if (!product) return res.status(400).json({ error: 'Product not found' })
    order = await prisma.order.create({
      data: {
        userId,
        totalCents: product.priceCents,
        status: 'paid',
        stripeSessionId: sessionId,
      },
    })
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        qty: 1,
        title: product.title,
        priceCents: product.priceCents,
      },
    })
  } else {
    const lineItems = (session.line_items as any)?.data || []
    const total = lineItems.reduce((sum: number, item: any) => sum + (item.amount_total || 0), 0)
    order = await prisma.order.create({
      data: {
        userId,
        totalCents: total,
        status: 'paid',
        stripeSessionId: sessionId,
      },
    })
    for (const item of lineItems) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.price?.product?.id || 'unknown',
          qty: item.quantity || 1,
          title: item.description || 'Order item',
          priceCents: item.amount_subtotal || item.amount_total || 0,
        },
      })
    }
  }

  return res.json(order)
}

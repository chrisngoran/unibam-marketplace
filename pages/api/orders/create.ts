import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { cartId, userId } = req.body
  if (!cartId) return res.status(400).json({ error: 'cartId required' })

  const cart = await prisma.cart.findUnique({ where: { id: cartId }, include: { items: true } })
  if (!cart || !cart.items || cart.items.length === 0) return res.status(400).json({ error: 'cart empty' })

  const total = cart.items.reduce((s, it) => s + (it.priceCents || 0) * (it.qty || 1), 0)
  const order = await prisma.order.create({ data: { userId: userId || null, totalCents: total } })

  await prisma.orderItem.createMany({
    data: cart.items.map(it => ({
      orderId: order.id,
      productId: it.productId,
      qty: it.qty || 1,
      title: it.title || undefined,
      priceCents: it.priceCents || 0,
    })),
  })

  await prisma.cartItem.deleteMany({ where: { cartId } })
  await prisma.cart.delete({ where: { id: cartId } })

  const url = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/checkout/success?orderId=${order.id}`
  res.json({ ok: true, orderId: order.id, url })
}

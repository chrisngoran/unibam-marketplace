import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req
  const { cartId, userId } = req.query as any

  if (method === 'GET') {
    let cart
    if (cartId) {
      cart = await prisma.cart.findUnique({ where: { id: cartId }, include: { items: true } })
    } else if (userId) {
      cart = await prisma.cart.findFirst({ where: { userId }, include: { items: true } })
    }
    return res.status(200).json(cart || { items: [] })
  }

  if (method === 'POST') {
    const body = req.body
    const requestedCartId = cartId || body.cartId || body.clientCartId
    let cart

    if (requestedCartId) {
      cart = await prisma.cart.upsert({
        where: { id: requestedCartId },
        update: {},
        create: { id: requestedCartId, userId: body.userId || null },
      })
    } else {
      cart = await prisma.cart.create({ data: { userId: body.userId || null } })
    }

    if (body.productId) {
      const existing = await prisma.cartItem.findFirst({ where: { cartId: cart.id, productId: body.productId } })
      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { qty: existing.qty + (body.qty || 1), title: body.title, priceCents: body.priceCents },
        })
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: body.productId,
            qty: body.qty || 1,
            title: body.title,
            priceCents: body.priceCents,
          },
        })
      }
    }

    if (body.items) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
      for (const item of body.items) {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: item.productId,
            qty: item.qty || 1,
            title: item.title,
            priceCents: item.priceCents,
          },
        })
      }
    }

    if (body.userId) {
      await prisma.cart.update({ where: { id: cart.id }, data: { userId: body.userId } })
    }

    const updated = await prisma.cart.findUnique({ where: { id: cart.id }, include: { items: true } })
    return res.status(200).json({ cartId: cart.id, cart: updated })
  }

  if (method === 'PUT') {
    if (!cartId) return res.status(400).json({ error: 'cartId required' })
    const body = req.body
    await prisma.cartItem.deleteMany({ where: { cartId } })
    if (body.items) {
      for (const item of body.items) {
        await prisma.cartItem.create({
          data: {
            cartId,
            productId: item.productId,
            qty: item.qty || 1,
            title: item.title,
            priceCents: item.priceCents,
          },
        })
      }
    }
    if (body.userId) {
      await prisma.cart.update({ where: { id: cartId }, data: { userId: body.userId } })
    }
    const updated = await prisma.cart.findUnique({ where: { id: cartId }, include: { items: true } })
    return res.status(200).json(updated)
  }

  if (method === 'DELETE') {
    if (!cartId) return res.status(400).json({ error: 'cartId required' })
    await prisma.cartItem.deleteMany({ where: { cartId } })
    await prisma.cart.delete({ where: { id: cartId } })
    return res.status(200).json({ ok: true })
  }

  res.setHeader('Allow', 'GET,POST,PUT,DELETE')
  res.status(405).end()
}

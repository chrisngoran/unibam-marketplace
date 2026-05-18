import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req
  const { userId, orderId } = req.query as any

  if (method === 'GET') {
    if (orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } })
      if (!order) return res.status(404).json({ error: 'Order not found' })
      return res.json(order)
    }

    if (!userId) {
      return res.status(400).json({ error: 'userId required' })
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })

    return res.json(orders)
  }

  res.setHeader('Allow', ['GET'])
  res.status(405).end(`Method ${method} Not Allowed`)
}

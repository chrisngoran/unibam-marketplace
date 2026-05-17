import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (typeof id !== 'string') return res.status(400).end()

  if (req.method === 'GET') {
    const product = await prisma.product.findUnique({ where: { id }, include: { owner: { select: { id: true, name: true, email: true } } } })
    if (!product) return res.status(404).json({ error: 'Not found' })
    return res.status(200).json(product)
  }

  if (req.method === 'PUT') {
    const session = (await getServerSession(req, res, authOptions as any)) as any
    if (!session || !session.user) return res.status(401).json({ error: 'Unauthorized' })

    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Not found' })
    // only owner can update
    if (existing.ownerId !== session.user.id) return res.status(403).json({ error: 'Forbidden' })

    const { title, description, category, priceCents, image } = req.body
    const updated = await prisma.product.update({ where: { id }, data: { title, description, category, priceCents: Number(priceCents), image } })
    return res.status(200).json(updated)
  }

  if (req.method === 'DELETE') {
    const session = (await getServerSession(req, res, authOptions as any)) as any
    if (!session || !session.user) return res.status(401).json({ error: 'Unauthorized' })

    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Not found' })
    if (existing.ownerId !== session.user.id) return res.status(403).json({ error: 'Forbidden' })

    await prisma.product.delete({ where: { id } })
    return res.status(204).end()
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}

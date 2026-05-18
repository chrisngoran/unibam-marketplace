import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { productId } = req.query as any
    if (!productId) return res.status(400).json({ error: 'productId required' })
    const reviews = await prisma.review.findMany({ where: { productId }, orderBy: { createdAt: 'desc' } })
    return res.json(reviews)
  }

  if (req.method === 'POST') {
    const { productId, userId, rating, body } = req.body
    if (!productId || !userId || !rating) return res.status(400).json({ error: 'missing fields' })
    const review = await prisma.review.create({ data: { productId, userId, rating: Number(rating), body } })
    return res.json(review)
  }

  res.setHeader('Allow', 'GET,POST')
  res.status(405).end()
}

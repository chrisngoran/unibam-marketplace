import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const products = await prisma.product.findMany({ include: { owner: { select: { id: true, name: true, email: true } } } })
    return res.status(200).json(products)
  }

  if (req.method === 'POST') {
    const session = (await getServerSession(req, res, authOptions as any)) as any
    if (!session || !session.user) return res.status(401).json({ error: 'Unauthorized' })

    const { title, description, category, priceCents, image } = req.body
    if (!title || !priceCents) return res.status(400).json({ error: 'Missing fields' })

    const user = await prisma.user.findUnique({ where: { email: session.user.email || undefined } })
    if (!user) return res.status(400).json({ error: 'User not found' })

    const product = await prisma.product.create({
      data: {
        title,
        description,
        category,
        priceCents: Number(priceCents),
        image,
        owner: { connect: { id: user.id } },
      },
    })

    return res.status(201).json(product)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}

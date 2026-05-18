import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  let user = await prisma.user.findUnique({ where: { email: 'demo@unibam.local' } })
  if (!user) {
    user = await prisma.user.create({ data: { email: 'demo@unibam.local', name: 'Demo Seller' } })
  }

  const product = await prisma.product.create({
    data: {
      title: 'Demo Laptop',
      description: 'Lightweight demo laptop for testing the marketplace.',
      priceCents: 49900,
      category: 'Electronics',
      image: 'https://via.placeholder.com/600x400?text=Demo+Laptop',
      ownerId: user.id,
    },
  })

  res.json({ ok: true, product })
}

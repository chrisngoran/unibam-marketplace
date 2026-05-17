import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'

const stripe = new Stripe(process.env.STRIPE_SECRET || '', { apiVersion: '2022-11-15' })
const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { productId } = req.body
  if (!productId) return res.status(400).json({ error: 'Missing productId' })

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) return res.status(404).json({ error: 'Product not found' })

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: product.title, description: product.description || undefined },
          unit_amount: product.priceCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/?success=1`,
    cancel_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/?canceled=1`,
  })

  res.status(200).json({ url: session.url })
}

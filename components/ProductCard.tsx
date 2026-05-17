import Link from 'next/link'

type Product = {
  id: string
  title: string
  description?: string
  priceCents: number
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.id}`} className="block border rounded p-4 hover:shadow-lg transition">
      <h2 className="text-xl font-semibold">{product.title}</h2>
      <p className="text-sm text-gray-600 mt-2">{product.description || 'No description provided.'}</p>
      <div className="mt-4 font-medium">{(product.priceCents / 100).toFixed(2)} USD</div>
    </Link>
  )
}

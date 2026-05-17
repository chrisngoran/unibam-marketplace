import Head from 'next/head'
import { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard'
import Header from '../components/Header'

type Product = { id: string; title: string; description?: string; category?: string; priceCents: number }

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(setProducts)
  }, [])

  return (
    <div>
      <Head>
        <title>University of Bamenda Marketplace</title>
      </Head>
      <Header />
      <main className="max-w-4xl mx-auto p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">University of Bamenda Marketplace</h1>
            <p className="text-sm text-gray-600 mt-1">Buy and sell items on campus with secure checkout and account integration.</p>
          </div>
          <a href="/products/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Post a listing</a>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr,200px] mb-6">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by title, category, or description"
            className="w-full border p-3 rounded"
          />
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border p-3 rounded">
            <option value="">All categories</option>
            {[...new Set(products.map(p => p.category).filter(Boolean))].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {products.length === 0 ? (
          <div className="rounded border border-dashed border-gray-300 p-8 text-center text-gray-500">
            No listings yet. Be the first to post an item.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products
              .filter(p => {
                const text = `${p.title} ${p.description || ''} ${p.category || ''}`.toLowerCase()
                return text.includes(query.toLowerCase()) && (category ? p.category === category : true)
              })
              .map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
          </div>
        )}
      </main>
    </div>
  )
}

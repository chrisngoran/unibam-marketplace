import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import Header from '../../components/Header'

export default function ProductPage() {
  const router = useRouter()
  const { id } = router.query
  const { data: session } = useSession()
  const [product, setProduct] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/products/${id}`)
      .then(async r => {
        if (!r.ok) {
          const data = await r.json().catch(() => null)
          throw new Error(data?.error || 'Product not found')
        }
        return r.json()
      })
      .then(setProduct)
      .catch(err => setError(err.message))
  }, [id])

  const isOwner = session?.user && (session.user as any).id && product?.owner?.id === (session.user as any).id

  async function buy() {
    setLoading(true)
    const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: product.id }) })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(false)
  }

  async function deleteProduct() {
    if (!confirm('Delete this listing?')) return
    const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' })
    if (res.ok) router.push('/')
    else alert('Could not delete listing')
  }

  if (error) return (
    <div>
      <Header />
      <main className="max-w-2xl mx-auto p-6">
        <p className="text-red-600">{error}</p>
        <Link href="/" className="mt-4 inline-block text-blue-600">Back to listings</Link>
      </main>
    </div>
  )

  if (!product) return <div>Loading...</div>

  return (
    <div>
      <Header />
      <main className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="text-blue-600">← Back to market</Link>
          {isOwner && (
            <div className="flex gap-2">
              <Link href={`/products/${product.id}/edit`} className="bg-gray-200 px-3 py-2 rounded hover:bg-gray-300">Edit</Link>
              <button onClick={deleteProduct} className="bg-red-600 text-white px-3 py-2 rounded">Delete</button>
            </div>
          )}
        </div>
        <h1 className="text-2xl font-bold">{product.title}</h1>
        <div className="mt-2 text-sm text-gray-600">{product.category || 'Uncategorized'}</div>
        <p className="text-sm text-gray-600 mt-4">{product.description || 'No description provided.'}</p>
        <div className="mt-4 text-sm text-gray-700">Sold by: {product.owner?.name || product.owner?.email || 'Unknown'}</div>
        <div className="mt-4 font-medium">{(product.priceCents / 100).toFixed(2)} USD</div>
        {!isOwner && (
          <div className="mt-6">
            <button onClick={buy} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-60">
              {loading ? 'Processing...' : 'Buy'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

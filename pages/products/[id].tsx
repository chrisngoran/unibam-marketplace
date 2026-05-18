import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import Header from '../../components/Header'

type ProductImage = { url: string }

export default function ProductPage() {
  const router = useRouter()
  const { id } = router.query
  const { data: session } = useSession()
  const [product, setProduct] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])
  const [recommended, setRecommended] = useState<any[]>([])
  const [newReview, setNewReview] = useState('')
  const [newRating, setNewRating] = useState(5)

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

  useEffect(() => {
    if (!id) return
    fetch(`/api/reviews?productId=${id}`)
      .then(r => r.json())
      .then(setReviews)
      .catch(() => {})
  }, [id])

  useEffect(() => {
    if (!product?.category) return
    fetch('/api/products')
      .then(r => r.json())
      .then((items: any[]) => setRecommended(items.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4)))
      .catch(() => {})
  }, [product])

  const isOwner = session?.user && (session.user as any).id && product?.owner?.id === (session.user as any).id

  async function buy() {
    setLoading(true)
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id, userId: (session?.user as any)?.id }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(false)
  }

  async function addToCart(qty = 1) {
    setAdding(true)
    let cartId = localStorage.getItem('cartId')
    const body: any = { productId: product.id, title: product.title, priceCents: product.priceCents, qty }
    if (cartId) body.cartId = cartId
    const res = await fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    if (data.cartId) localStorage.setItem('cartId', data.cartId)
    setAdding(false)
    alert('Added to cart')
  }

  async function submitReview() {
    if (!newReview) return alert('Write a review')
    const res = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: product.id, userId: (session?.user as any)?.id, rating: newRating, body: newReview }) })
    if (res.ok) {
      setNewReview('')
      setNewRating(5)
      const r = await res.json()
      setReviews(prev => [r, ...prev])
    }
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
        <div className="mt-4 text-sm text-gray-600">{product.description || 'No description provided.'}</div>
        <div className="mt-4 text-sm text-gray-700">Sold by: {product.owner?.name || product.owner?.email || 'Unknown'}</div>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr,300px]">
          <div>
            {/* images */}
            {product.images ? (
              (() => {
                try {
                  const images = JSON.parse(product.images)
                  return images?.length > 0 ? (
                    <img src={images[0]?.url} alt={product.title} className="w-full max-h-80 object-cover rounded" />
                  ) : product.image ? (
                    <img src={product.image} alt={product.title} className="w-full max-h-80 object-cover rounded" />
                  ) : (
                    <div className="w-full h-64 bg-gray-100 flex items-center justify-center text-gray-400">No image</div>
                  )
                } catch {
                  return product.image ? (
                    <img src={product.image} alt={product.title} className="w-full max-h-80 object-cover rounded" />
                  ) : (
                    <div className="w-full h-64 bg-gray-100 flex items-center justify-center text-gray-400">No image</div>
                  )
                }
              })()
            ) : product.image ? (
              <img src={product.image} alt={product.title} className="w-full max-h-80 object-cover rounded" />
            ) : (
              <div className="w-full h-64 bg-gray-100 flex items-center justify-center text-gray-400">No image</div>
            )}
            {/* specs placeholder */}
            {product.specs ? (
              (() => {
                try {
                  const specs = JSON.parse(product.specs)
                  return specs && Object.keys(specs).length > 0 ? (
                    <div className="mt-4">
                      <h3 className="font-semibold">Specifications</h3>
                      <ul className="text-sm list-disc ml-5 mt-2">
                        {Object.entries(specs).map(([k, v]) => (
                          <li key={k}><strong>{k}:</strong> {String(v)}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null
                } catch {
                  return null
                }
              })()
            ) : null}
          </div>

          <div className="border rounded p-4">
            <div className="text-2xl font-bold">{(product.priceCents / 100).toFixed(2)} USD</div>
            <div className="text-sm text-gray-600 mt-2">In stock</div>
            {!isOwner && (
              <div className="mt-4 flex gap-2">
                <button onClick={() => addToCart(1)} disabled={adding} className="flex-1 bg-yellow-500 text-black py-2 rounded">Add to cart</button>
                <button onClick={buy} disabled={loading} className="flex-1 bg-green-600 text-white py-2 rounded">{loading ? 'Processing...' : 'Buy now'}</button>
              </div>
            )}
          </div>
        </div>
        <div className="mt-8">
          <h2 className="font-semibold">Reviews</h2>
          {reviews.length === 0 ? <div className="text-sm text-gray-500 mt-2">No reviews yet</div> : (
            <div className="mt-2 space-y-3">
              {reviews.map(r => (
                <div key={r.id} className="border p-2 rounded">
                  <div className="text-sm font-semibold">{r.userId} — {r.rating}/5</div>
                  <div className="text-sm text-gray-700">{r.body}</div>
                </div>
              ))}
            </div>
          )}
          {reviews.length > 0 && (
            <div className="mt-4 text-sm text-gray-600">Average rating: {(
              reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length
            ).toFixed(1)} / 5</div>
          )}

          {session?.user && (
            <div className="mt-4">
              <h3 className="font-semibold">Write a review</h3>
              <textarea value={newReview} onChange={e => setNewReview(e.target.value)} className="w-full border p-2 mt-2" />
              <div className="mt-2 flex items-center gap-2">
                <select value={newRating} onChange={e => setNewRating(Number(e.target.value))} className="border p-1">
                  {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <button onClick={submitReview} className="bg-blue-600 text-white px-3 py-1 rounded">Submit</button>
              </div>
            </div>
          )}
        </div>
        {recommended.length > 0 && (
          <div className="mt-8">
            <h2 className="font-semibold">Recommended for you</h2>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {recommended.map(item => (
                <Link key={item.id} href={`/products/${item.id}`} className="border rounded p-3 hover:shadow-sm">
                  <div className="font-semibold">{item.title}</div>
                  <div className="text-sm text-gray-600">{item.category || 'Other'}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

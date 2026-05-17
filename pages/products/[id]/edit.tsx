import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Header from '../../../components/Header'

export default function EditProduct() {
  const router = useRouter()
  const { id } = router.query
  const { data: session } = useSession()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(product => {
        if (product.error) {
          setError(product.error)
          return
        }
        setTitle(product.title)
        setDescription(product.description || '')
        setCategory(product.category || '')
        setPrice((product.priceCents / 100).toFixed(2))
      })
  }, [id])

  async function submit(e: any) {
    e.preventDefault()
    if (!session) {
      setError('You must be signed in to edit this listing.')
      return
    }

    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, category, priceCents: Math.round(Number(price) * 100) }),
    })

    if (res.ok) router.push(`/products/${id}`)
    else {
      const data = await res.json().catch(() => null)
      setError(data?.error || 'Unable to update listing.')
    }
  }

  return (
    <div>
      <Header />
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Edit listing</h1>
        {error && <div className="mb-4 rounded border border-red-300 bg-red-50 p-4 text-red-700">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border p-2" />
          </div>
          <div>
            <label className="block text-sm">Category</label>
            <input value={category} onChange={e => setCategory(e.target.value)} className="w-full border p-2" />
          </div>
          <div>
            <label className="block text-sm">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border p-2" />
          </div>
          <div>
            <label className="block text-sm">Price (USD)</label>
            <input value={price} onChange={e => setPrice(e.target.value)} className="w-full border p-2" />
          </div>
          <div className="flex gap-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded">Update</button>
            <button type="button" onClick={() => router.back()} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
          </div>
        </form>
      </main>
    </div>
  )
}

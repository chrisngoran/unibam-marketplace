import { useState } from 'react'
import { useRouter } from 'next/router'
import { useSession, signIn } from 'next-auth/react'
import Header from '../../components/Header'

export default function NewProduct() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const router = useRouter()
  const { data: session } = useSession()

  async function submit(e: any) {
    e.preventDefault()
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, category, priceCents: Math.round(Number(price) * 100) }),
    })
    if (res.ok) router.push('/')
    else alert('Error creating product')
  }

  return (
    <div>
      <Header />
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Sell an item</h1>
        {!session ? (
          <div className="rounded border px-4 py-6 text-center">
            <p className="mb-4">You need to sign in before posting a listing.</p>
            <button onClick={() => signIn()} className="bg-blue-600 text-white px-4 py-2 rounded">Sign in</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border p-2" />
            </div>
            <div>
              <label className="block text-sm">Category</label>
              <input value={category} onChange={e => setCategory(e.target.value)} className="w-full border p-2" placeholder="e.g. Textbooks, Electronics" />
            </div>
            <div>
              <label className="block text-sm">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border p-2" />
            </div>
            <div>
              <label className="block text-sm">Price (USD)</label>
              <input value={price} onChange={e => setPrice(e.target.value)} className="w-full border p-2" />
            </div>
            <div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded">Create</button>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}

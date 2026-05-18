import { useEffect, useState } from 'react'
import Header from '../components/Header'
import { useSession } from 'next-auth/react'

type Item = { productId: string; title?: string; qty: number; priceCents?: number }

export default function CartPage() {
  const { data: session } = useSession()
  const [cartId, setCartId] = useState<string | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const id = localStorage.getItem('cartId')
    if (id) setCartId(id)
  }, [])

  useEffect(() => {
    async function load() {
      const userId = (session?.user as any)?.id
      const q = cartId ? `/api/cart?cartId=${cartId}` : userId ? `/api/cart?userId=${userId}` : null
      if (!q) return
      const r = await fetch(q)
      const c = await r.json()
      setItems(c.items || [])
    }
    load()
  }, [cartId, session])

  function updateQty(index: number, qty: number) {
    const next = [...items]
    next[index].qty = qty
    setItems(next)
    persist(next)
  }

  function remove(index: number) {
    const next = items.filter((_, i) => i !== index)
    setItems(next)
    persist(next)
  }

  async function persist(nextItems: Item[]) {
    setLoading(true)
    let id = cartId
      if (!id) {
      // create new cart
      const res = await fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: nextItems }) })
      const data = await res.json()
        id = data.cartId
        localStorage.setItem('cartId', id as string)
      setCartId(id)
    } else {
      await fetch(`/api/cart?cartId=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: nextItems }) })
    }
    // if logged in, link cart to user
    const userId = (session?.user as any)?.id
    if (userId && id) {
      await fetch('/api/cart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cartId: id, userId }) })
    }
    setLoading(false)
  }

  async function checkout() {
    const id = cartId
    if (!id) return alert('Cart is empty')
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cartId: id, userId: (session?.user as any)?.id }) })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || 'Unable to checkout')
    } finally {
      setLoading(false)
    }
  }

  const total = items.reduce((s, it) => s + (it.priceCents || 0) * (it.qty || 1), 0)

  return (
    <div>
      <Header />
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Shopping Cart</h1>
        {items.length === 0 ? (
          <div className="mt-6 text-gray-500">Your cart is empty.</div>
        ) : (
          <div className="mt-6">
            {items.map((it, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b">
                <div>
                  <div className="font-semibold">{it.title}</div>
                  <div className="text-sm text-gray-500">${((it.priceCents || 0) / 100).toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" value={it.qty} min={1} onChange={e => updateQty(i, Number(e.target.value))} className="w-16 border p-1" />
                  <button onClick={() => remove(i)} className="text-red-600">Remove</button>
                </div>
              </div>
            ))}

            <div className="mt-4 flex justify-between items-center">
              <div className="font-semibold">Total: ${(total / 100).toFixed(2)}</div>
              <div>
                <button onClick={checkout} className="bg-green-600 text-white px-4 py-2 rounded">Checkout</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Header from '../../components/Header'

export default function Success() {
  const router = useRouter()
  const { mock, productId, cartId, orderId, session_id } = router.query as any
  const [order, setOrder] = useState<any | null>(null)
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    const clearCartLocal = () => {
      if (cartId) {
        localStorage.removeItem('cartId')
      }
    }

    if (!router.isReady) return

    const loadOrder = async () => {
      if (orderId) {
        const res = await fetch(`/api/orders?orderId=${orderId}`)
        const data = await res.json()
        setOrder(data)
        clearCartLocal()
        return
      }

      if (session_id) {
        const res = await fetch(`/api/checkout/complete?sessionId=${encodeURIComponent(session_id)}`)
        const data = await res.json()
        if (!data.error) {
          setOrder(data)
          localStorage.removeItem('cartId')
          return
        }
      }

      if (mock && productId) {
        fetch(`/api/products/${productId}`)
          .then(r => r.json())
          .then(p => setItems([{ title: p.title, qty: 1, priceCents: p.priceCents }]))
          .catch(() => {})
      }
      if (mock && cartId) {
        fetch(`/api/cart?cartId=${cartId}`)
          .then(r => r.json())
          .then(c => setItems(c.items || []))
          .catch(() => {})
      }
    }

    loadOrder()
  }, [router.isReady, mock, productId, cartId, orderId, session_id])

  const summaryItems = order ? order.items : items
  const total = summaryItems.reduce((s: number, it: any) => s + (it.priceCents || 0) * (it.qty || 1), 0)

  return (
    <div>
      <Header />
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Order placed</h1>
        <p className="text-sm text-gray-600 mt-2">{order ? 'Your order has been recorded.' : 'This is a mock success page for local testing.'}</p>

        <div className="mt-4">
          {summaryItems.length === 0 ? (
            <div className="text-sm text-gray-500">No items found.</div>
          ) : (
            <div>
              {summaryItems.map((it: any, i: number) => (
                <div key={i} className="flex justify-between py-2">
                  <div>{it.title}</div>
                  <div>x{it.qty} — ${(it.priceCents / 100).toFixed(2)}</div>
                </div>
              ))}
              <div className="mt-4 font-semibold">Total: ${(total / 100).toFixed(2)}</div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Link href="/" className="text-blue-600">Back to marketplace</Link>
        </div>
      </main>
    </div>
  )
}

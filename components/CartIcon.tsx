import { useEffect, useState } from 'react'
import Link from 'next/link'

type CartItem = { productId: string; title?: string; qty: number; priceCents?: number }

export default function CartIcon() {
  const [count, setCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const cartId = localStorage.getItem('cartId')
    if (!cartId) return
    fetch(`/api/cart?cartId=${cartId}`)
      .then(r => r.json())
      .then(data => {
        setItems(data.items || [])
        setCount((data.items || []).reduce((s: number, it: CartItem) => s + it.qty, 0))
      })
      .catch(() => {})
  }, [])

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4" />
        </svg>
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-1">{count}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white border shadow p-3 z-50">
          <div className="font-semibold">Cart</div>
          {items.length === 0 ? (
            <div className="text-sm text-gray-500 mt-2">Your cart is empty</div>
          ) : (
            <div className="mt-2">
              {items.slice(0, 5).map((it, i) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <div>{it.title || 'Item'}</div>
                  <div>x{it.qty}</div>
                </div>
              ))}
              <div className="mt-2">
                <Link href="/cart" className="block text-center bg-blue-600 text-white py-2 rounded">View Cart</Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

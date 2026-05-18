import { useEffect, useState } from 'react'
import Header from '../components/Header'
import { useSession } from 'next-auth/react'

type OrderItem = {
  id: string
  title?: string
  qty: number
  priceCents: number
}

type Order = {
  id: string
  totalCents: number
  createdAt: string
  items: OrderItem[]
}

export default function OrdersPage() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    const userId = (session?.user as any)?.id
    if (!userId) return
    fetch(`/api/orders?userId=${userId}`)
      .then(r => r.json())
      .then(setOrders)
      .catch(() => {})
  }, [session])

  return (
    <div>
      <Header />
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Your Orders</h1>
        {!session ? (
          <div className="mt-6 text-gray-600">Sign in to view your order history.</div>
        ) : orders.length === 0 ? (
          <div className="mt-6 text-gray-600">No orders yet. Shop the marketplace to place your first order.</div>
        ) : (
          <div className="mt-6 space-y-6">
            {orders.map(order => (
              <div key={order.id} className="border rounded p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Order #{order.id}</div>
                    <div className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="font-semibold">Total ${(order.totalCents / 100).toFixed(2)}</div>
                </div>
                <div className="mt-4 space-y-2">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.title || 'Item'} x{item.qty}</span>
                      <span>${((item.priceCents || 0) / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

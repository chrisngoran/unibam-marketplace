import Link from 'next/link'
import { signIn, signOut, useSession } from 'next-auth/react'
import CartIcon from './CartIcon'

export default function Header() {
  const { data: session } = useSession()
  return (
    <header className="bg-white border-b">
      <div className="max-w-6xl mx-auto p-4 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-yellow-400 text-black font-bold px-3 py-1 rounded">UB</div>
          <span className="font-bold text-lg">Unibam Marketplace</span>
        </Link>

        <div className="flex-1">
          <div className="max-w-3xl mx-auto">
            <input
              aria-label="Search"
              placeholder="Search products, categories, and more"
              className="w-full border rounded p-2"
              onKeyDown={(e: any) => {
                if (e.key === 'Enter') {
                  const q = e.target.value
                  window.location.href = `/?q=${encodeURIComponent(q)}`
                }
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/products/new" className="hidden md:inline text-sm">Sell</Link>
          {session?.user && <Link href="/orders" className="hidden md:inline text-sm">Orders</Link>}
          <CartIcon />
          <div>
            {session?.user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm hidden md:inline">{session.user.name || session.user.email}</span>
                <button onClick={() => signOut()} className="text-sm">Sign out</button>
              </div>
            ) : (
              <button onClick={() => signIn()} className="text-sm">Sign in</button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

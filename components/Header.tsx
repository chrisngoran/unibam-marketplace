import Link from 'next/link'
import { signIn, signOut, useSession } from 'next-auth/react'

export default function Header() {
  const { data: session } = useSession()
  return (
    <header className="bg-white border-b">
      <div className="max-w-4xl mx-auto p-4 flex justify-between items-center">
        <Link href="/" className="font-bold">Unibam Marketplace</Link>
        <nav className="flex items-center gap-3">
          <Link href="/products/new" className="text-sm">Sell</Link>
          {session?.user ? (
            <>
              <span className="text-sm">{session.user.name || session.user.email}</span>
              <button onClick={() => signOut()} className="ml-2 text-sm">Sign out</button>
            </>
          ) : (
            <button onClick={() => signIn()} className="text-sm">Sign in</button>
          )}
        </nav>
      </div>
    </header>
  )
}

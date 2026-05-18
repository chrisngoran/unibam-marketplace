import type { ReactNode, FormEvent } from 'react'
import { useState } from 'react'
import { GetServerSidePropsContext } from 'next'
import { useRouter } from 'next/router'
import { getProviders, signIn } from 'next-auth/react'
import Header from '../../components/Header'

type Provider = {
  id: string
  name: string
  type: string
  signinUrl: string
  callbackUrl: string
}

type Props = {
  providers: Record<string, Provider> | null
}

const providerIcons: Record<string, ReactNode> = {
  github: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.725-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.238 1.84 1.238 1.07 1.835 2.807 1.305 3.492.998.108-.775.42-1.305.763-1.605-2.665-.305-5.466-1.332-5.466-5.93 0-1.31.468-2.382 1.236-3.22-.124-.303-.536-1.525.117-3.176 0 0 1.008-.322 3.3 1.23a11.52 11.52 0 0 1 3.003-.404c1.018.005 2.044.138 3.003.404 2.29-1.552 3.296-1.23 3.296-1.23.655 1.65.243 2.873.12 3.176.77.838 1.234 1.91 1.234 3.22 0 4.61-2.803 5.624-5.475 5.92.43.37.815 1.096.815 2.21 0 1.596-.015 2.882-.015 3.273 0 .32.216.694.825.576C20.565 21.796 24 17.298 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  ),
  google: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#EA4335" d="M12 11.63v2.82h4.4c-.185 1.13-.85 2.087-1.82 2.73v2.27h2.95c1.727-1.59 2.7-3.94 2.7-6.73 0-.57-.06-1.12-.17-1.66H12z" />
      <path fill="#34A853" d="M6.45 13.08c-.17-.5-.27-1.02-.27-1.58s.1-1.08.27-1.58V7.65H3.5A8.99 8.99 0 0 0 2 12c0 1.45.35 2.82.98 4.03l2.47-1.95z" />
      <path fill="#4A90E2" d="M12 6.2c1.27 0 2.42.44 3.32 1.31l2.49-2.48A9 9 0 0 0 12 2.5a8.99 8.99 0 0 0-8.5 5.15l2.47 1.95A5.4 5.4 0 0 1 12 6.2z" />
      <path fill="#FBBC05" d="M4.47 8.1l2.47 1.95A5.4 5.4 0 0 1 12 6.2c1.33 0 2.55.45 3.52 1.2l2.49-2.48C17.61 3.99 14.99 3 12 3 7.96 3 4.68 5.42 3.5 8.65l.97-.55z" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M22.675 0h-21.35C.593 0 0 .593 0 1.326v21.348C0 23.407.593 24 1.326 24H12.82v-9.294H9.692V11.04h3.128V8.414c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.464.099 2.796.143v3.24l-1.918.001c-1.504 0-1.796.715-1.796 1.764v2.313h3.587l-.467 3.666h-3.12V24h6.116C23.407 24 24 23.407 24 22.674V1.326C24 .593 23.407 0 22.675 0z" />
    </svg>
  ),
}

const providerLabels: Record<string, string> = {
  github: 'Sign in with GitHub',
  google: 'Sign in with Google',
  facebook: 'Sign in with Facebook',
  credentials: 'Sign in with Demo account',
}

export default function SignInPage({ providers }: Props) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const providerList = providers ? Object.values(providers) : []
  const oauthProviders = providerList.filter(provider => provider.type !== 'credentials')
  const hasCredentialsProvider = providerList.some(provider => provider.type === 'credentials')
  const callbackUrl = typeof router.query.callbackUrl === 'string' ? router.query.callbackUrl : '/'

  async function handleCredentialSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setLoading(true)

    const response = await signIn('credentials', {
      redirect: false,
      email,
      password,
      callbackUrl,
    })

    setLoading(false)

    if (response?.error) {
      setErrorMessage(response.error)
      return
    }

    if (response?.url) {
      window.location.href = response.url
    }
  }

  return (
    <div>
      <Header />
      <main className="max-w-xl mx-auto p-6">
        <h1 className="text-3xl font-bold">Sign in</h1>
        <p className="mt-2 text-sm text-gray-600">Choose a provider to sign in and access your cart, listings, and orders.</p>

        {oauthProviders.length > 0 ? (
          <div className="mt-6 space-y-3">
            {oauthProviders.map(provider => (
              <button
                key={provider.id}
                onClick={() => signIn(provider.id, { callbackUrl })}
                className="w-full rounded border border-gray-300 bg-white py-3 px-4 text-left hover:bg-gray-50 flex items-center gap-3"
              >
                <span className="text-gray-500">{providerIcons[provider.id.toLowerCase()] || null}</span>
                <span className="font-medium">{providerLabels[provider.id.toLowerCase()] || provider.name}</span>
              </button>
            ))}
          </div>
        ) : null}

        {hasCredentialsProvider ? (
          <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Demo login</h2>
            <p className="mt-2 text-sm text-gray-600">Use a demo account if OAuth providers are not configured.</p>

            <form className="mt-4 space-y-4" onSubmit={handleCredentialSignIn}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  placeholder="demo@bamenda.edu"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  placeholder="demo password"
                  required
                />
              </div>

              {errorMessage ? (
                <p className="text-sm text-red-600">{errorMessage}</p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Signing in…' : 'Sign in with demo account'}
              </button>
            </form>
          </div>
        ) : null}

        {oauthProviders.length === 0 && !hasCredentialsProvider ? (
          <div className="mt-6 rounded border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
            No authentication providers are configured yet. Please set up GitHub, Google, or Facebook credentials in your environment variables.
          </div>
        ) : null}

        <div className="mt-6 text-sm text-gray-500">
          If you want Google or Facebook login buttons, add:
          <div className="mt-2 space-y-1">
            <div><code>GOOGLE_ID</code>, <code>GOOGLE_SECRET</code></div>
            <div><code>FACEBOOK_ID</code>, <code>FACEBOOK_SECRET</code></div>
          </div>
        </div>
      </main>
    </div>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const providers = await getProviders()
  return { props: { providers } }
}

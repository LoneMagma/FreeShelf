import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SearchClient from './_components/SearchClient'

export const metadata = { title: 'Price Check' }

export default function SearchPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl text-primary mb-2">
            Search Any Game
          </h1>
          <p className="text-secondary text-sm">
            Find current prices across every store, compare to historical lows, and save to wishlist.
          </p>
        </div>
        <SearchClient />
      </main>
      <Footer />
    </div>
  )
}

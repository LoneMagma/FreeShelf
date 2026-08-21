import DealCardSkeleton from '@/components/deals/DealCardSkeleton'

export default function HomeSkeleton() {
  return (
    <div className="min-h-screen flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-theme bg-surface/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded skeleton shrink-0" />
            <div className="h-5 w-24 rounded skeleton" />
          </div>
          <div className="hidden md:block h-8 w-64 rounded-lg skeleton flex-1 max-w-sm" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg skeleton" />
            <div className="h-8 w-24 rounded-lg skeleton hidden sm:block" />
          </div>
        </div>
      </header>

      {/* FilterBar */}
      <div className="border-b border-theme bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 overflow-hidden">
          {['All Platforms','Epic Games','GOG','Steam','Prime Gaming','Humble'].map(p => (
            <div key={p} className="h-8 rounded-lg skeleton shrink-0" style={{ width: `${p.length * 7 + 24}px` }} />
          ))}
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-3 flex items-center justify-between">
          <div className="h-4 w-32 rounded skeleton" />
          <div className="h-4 w-20 rounded skeleton" />
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6">

        {/* Hero */}
        <section className="text-center py-10 sm:py-12 space-y-3">
          <div className="h-12 w-56 rounded-lg skeleton mx-auto" />
          <div className="h-10 w-48 rounded-lg skeleton mx-auto" />
          <div className="h-4 w-72 rounded skeleton mx-auto mt-2" />
        </section>

        {/* Section tabs */}
        <div className="flex items-center gap-1 border-b border-theme mb-8">
          {['Expiring Soon', 'New', 'All Deals'].map(t => (
            <div key={t} className="h-10 rounded skeleton mx-1" style={{ width: `${t.length * 7 + 32}px` }} />
          ))}
        </div>

        {/* Deal grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-16">
          {Array.from({ length: 8 }).map((_, i) => (
            <DealCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  )
}

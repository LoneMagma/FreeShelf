export default function DealCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border border-theme bg-surface">
      {/* Image skeleton */}
      <div className="w-full aspect-[16/9] skeleton" />
      <div className="p-4 flex flex-col gap-3">
        {/* Title */}
        <div className="h-4 w-3/4 rounded skeleton" />
        <div className="h-3 w-1/2 rounded skeleton" />
        {/* Genre pills */}
        <div className="flex gap-1">
          <div className="h-4 w-12 rounded-full skeleton" />
          <div className="h-4 w-14 rounded-full skeleton" />
        </div>
        {/* Price row */}
        <div className="flex items-center justify-between pt-1 border-t border-theme">
          <div className="h-5 w-16 rounded skeleton" />
          <div className="h-4 w-20 rounded skeleton" />
        </div>
        {/* CTA */}
        <div className="h-8 w-full rounded-lg skeleton" />
      </div>
    </div>
  )
}

const QASkeleton = () => (
  <div className="space-y-6 pb-8">
    {/* Skeleton tabs */}
    <div className="flex p-1 bg-slate-100 rounded-xl">
      <div className="flex-1 py-2.5 flex items-center justify-center">
        <div className="w-28 h-4 rounded bg-slate-200/60 animate-pulse" />
      </div>
      <div className="flex-1 py-2.5 flex items-center justify-center">
        <div className="w-24 h-4 rounded bg-slate-200/60 animate-pulse" />
      </div>
    </div>
    {/* Skeleton button */}
    <div className="flex justify-center py-4">
      <div className="w-56 h-12 rounded-2xl bg-slate-200/60 animate-pulse" />
    </div>
    {/* Skeleton thread list */}
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="p-5 rounded-2xl border border-slate-100 bg-white animate-pulse flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-200/60 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="w-3/4 h-4 rounded bg-slate-200/60" />
            <div className="w-1/2 h-3 rounded bg-slate-200/60" />
          </div>
          <div className="w-14 h-3 rounded bg-slate-200/60" />
        </div>
      ))}
    </div>
  </div>
);

export default QASkeleton;

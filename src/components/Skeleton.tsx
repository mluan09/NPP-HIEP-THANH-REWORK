interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
};

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-3" role="status" aria-label="Đang tải dữ liệu...">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
};

export const SkeletonCards: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
          <Skeleton className="h-10 w-10 rounded-xl mb-4" />
          <Skeleton className="h-4 w-2/3 mb-2" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      ))}
    </div>
  );
};
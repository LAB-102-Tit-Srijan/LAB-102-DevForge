const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`skeleton ${className}`}
      {...props}
    />
  );
};

const SkeletonText = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
};

const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`bg-surface-elevated border border-border-subtle rounded-2xl p-6 ${className}`}>
      <Skeleton className="h-6 w-1/3 mb-4" />
      <SkeletonText lines={3} />
    </div>
  );
};

export { Skeleton, SkeletonText, SkeletonCard };
export default Skeleton;

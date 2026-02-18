interface SkeletonProps {
  className?: string;
}

const Skeleton = ({ className = '' }: SkeletonProps) => (
  <div className={`animate-pulse bg-slate-200/60 rounded-lg ${className}`} />
);

export default Skeleton;

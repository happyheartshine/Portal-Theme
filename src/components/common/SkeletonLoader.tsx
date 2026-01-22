import React from "react";

interface SkeletonLoaderProps {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  className?: string;
  lines?: number; // For text variant
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = "rectangular",
  width,
  height,
  className = "",
  lines = 1,
}) => {
  const baseClasses =
    "animate-pulse bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300";

  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;

  if (variant === "text" && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={index === lines - 1 ? { width: "80%" } : style}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

// Predefined skeleton components for common use cases
export const SkeletonCard = () => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
    <SkeletonLoader variant="text" width="60%" className="mb-4" />
    <SkeletonLoader variant="text" lines={3} />
  </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3">
    {/* Header */}
    <div className="flex gap-4">
      <SkeletonLoader variant="rectangular" width="20%" height={40} />
      <SkeletonLoader variant="rectangular" width="25%" height={40} />
      <SkeletonLoader variant="rectangular" width="20%" height={40} />
      <SkeletonLoader variant="rectangular" width="15%" height={40} />
      <SkeletonLoader variant="rectangular" width="20%" height={40} />
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="flex gap-4">
        <SkeletonLoader variant="rectangular" width="20%" height={50} />
        <SkeletonLoader variant="rectangular" width="25%" height={50} />
        <SkeletonLoader variant="rectangular" width="20%" height={50} />
        <SkeletonLoader variant="rectangular" width="15%" height={50} />
        <SkeletonLoader variant="rectangular" width="20%" height={50} />
      </div>
    ))}
  </div>
);

export const SkeletonAvatar = ({ size = 40 }: { size?: number }) => (
  <SkeletonLoader variant="circular" width={size} height={size} />
);

export default SkeletonLoader;


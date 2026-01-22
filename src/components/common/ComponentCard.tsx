import React from "react";

interface ComponentCardProps {
  title?: React.ReactNode; // Optional title (can be string or JSX)
  children: React.ReactNode;
  className?: string; // Additional custom classes for styling
  desc?: string; // Description text
  hoverable?: boolean; // Enable hover effects
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  className = "",
  desc = "",
  hoverable = false,
}) => {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03] transition-all duration-300 ease-in-out ${
        hoverable
          ? "hover:shadow-theme-md hover:-translate-y-0.5 hover:border-gray-300 dark:hover:border-gray-700"
          : ""
      } ${className}`}
    >
      {/* Card Header */}
      {title && (
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h3>
          {desc && (
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              {desc}
            </p>
          )}
        </div>
      )}

      {/* Card Body */}
      <div className={`p-4 sm:p-6 ${title ? '' : ''}`}>
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
};

export default ComponentCard;

import React, { ReactNode } from "react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
  valueClassName?: string;
}

export default function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  className = "",
  valueClassName = "",
}: DashboardCardProps) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </h5>
        {icon && (
          <div className="text-2xl text-brand-500">{icon}</div>
        )}
      </div>
      <h2 className={`text-3xl font-bold text-gray-800 dark:text-white/90 mb-1 ${valueClassName}`}>
        {value}
      </h2>
      {subtitle && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      )}
    </div>
  );
}


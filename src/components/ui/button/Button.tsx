import React, { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode; // Button text or content
  size?: "sm" | "md" | "lg"; // Button size
  variant?: "primary" | "outline" | "ghost" | "danger" | "success"; // Button variant
  startIcon?: ReactNode; // Icon before the text
  endIcon?: ReactNode; // Icon after the text
  onClick?: () => void; // Click handler
  disabled?: boolean; // Disabled state
  loading?: boolean; // Loading state
  className?: string; // Additional CSS classes
  type?: "button" | "submit" | "reset"; // Button type for forms
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  onClick,
  className = "",
  disabled = false,
  loading = false,
  type = "button",
}) => {
  // Size Classes
  const sizeClasses = {
    sm: "px-4 py-2.5 text-sm",
    md: "px-5 py-3 text-sm",
    lg: "px-6 py-3.5 text-base",
  };

  // Variant Classes with enhanced transitions and hover effects
  const variantClasses = {
    primary:
      "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 hover:shadow-theme-sm active:bg-brand-700 active:scale-[0.98] disabled:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200 ease-in-out",
    outline:
      "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:ring-gray-400 active:bg-gray-100 active:scale-[0.98] dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.05] dark:hover:text-gray-300 dark:hover:ring-gray-600 dark:active:bg-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 ease-in-out",
    ghost:
      "bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 active:scale-[0.98] dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-gray-300 dark:active:bg-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 ease-in-out",
    danger:
      "bg-error-500 text-white shadow-theme-xs hover:bg-error-600 hover:shadow-theme-sm active:bg-error-700 active:scale-[0.98] disabled:bg-error-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200 ease-in-out",
    success:
      "bg-success-500 text-white shadow-theme-xs hover:bg-success-600 hover:shadow-theme-sm active:bg-success-700 active:scale-[0.98] disabled:bg-success-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200 ease-in-out",
  };

  // Loading Spinner Component
  const LoadingSpinner = () => (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center font-medium gap-2 rounded-lg ${className} ${
        sizeClasses[size]
      } ${variantClasses[variant]}`}
      onClick={onClick}
      disabled={isDisabled}
    >
      {loading ? (
        <>
          <LoadingSpinner />
          <span className="opacity-75">{children}</span>
        </>
      ) : (
        <>
          {startIcon && (
            <span className="flex items-center transition-transform duration-200 group-hover:scale-110">
              {startIcon}
            </span>
          )}
          {children}
          {endIcon && (
            <span className="flex items-center transition-transform duration-200 group-hover:scale-110">
              {endIcon}
            </span>
          )}
        </>
      )}
    </button>
  );
};

export default Button;

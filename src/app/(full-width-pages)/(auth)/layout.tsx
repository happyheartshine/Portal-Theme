import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import { ThemeProvider } from "@/context/ThemeContext";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-900">
      <ThemeProvider>
        <div className="relative flex flex-col w-full min-h-screen items-center justify-center dark:bg-gray-900">
          {/* Logo and Title Section - Top Left */}
          <div className="absolute top-6 left-6 sm:top-8 sm:left-8">
            <Link href="/" className="flex items-center gap-3 transition-transform duration-200 hover:scale-105">
              <Image
                width={40}
                height={40}
                src="/images/logo/auth-logo.png"
                alt="Logo"
              />
              <div>
                <h1 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Portal
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Internal Operations & Team Management
                </p>
              </div>
            </Link>
          </div>

          {/* Theme Toggle - Bottom Right */}
          <div className="fixed bottom-6 right-6 z-50">
            <ThemeTogglerTwo />
          </div>

          {/* Sign In Form - Centered */}
          <div className="w-full max-w-md px-4">
            {children}
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}

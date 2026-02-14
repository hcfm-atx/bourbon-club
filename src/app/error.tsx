"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden p-6">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1612] via-[#2e2720] to-[#1a1612] -z-10" />

      {/* Subtle overlay pattern */}
      <div className="absolute inset-0 opacity-5 -z-10"
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
           }}
      />

      <div className="w-full max-w-md text-center relative">
        {/* Brand */}
        <h1 className="text-4xl md:text-5xl font-bold text-[#fbbf24] tracking-tight mb-12"
            style={{ fontFamily: 'var(--font-display), serif' }}>
          HOOTCH CLUB
        </h1>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl text-[#fef3c7] font-light mb-4"
              style={{ fontFamily: 'var(--font-display), serif' }}>
            Something Went Wrong
          </h2>
          <p className="text-[#a8a29e] text-sm md:text-base mb-6">
            We spilled something. Try refreshing the page.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            className="h-12 px-8 tracking-widest uppercase text-xs font-semibold bg-[#d97706] hover:bg-[#b45309] text-white shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            Try Again
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-12 px-8 tracking-widest uppercase text-xs font-semibold border-[#3d342b] text-[#f5f0e8] hover:bg-[#2e2720] transition-all duration-200"
          >
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

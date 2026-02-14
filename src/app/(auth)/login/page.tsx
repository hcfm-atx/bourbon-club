"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"magic-link" | "password">("magic-link");

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("email", { email, callbackUrl: "/dashboard", redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Something went wrong. Please try again.");
    } else {
      setSubmitted(true);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/dashboard",
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
    } else if (res?.ok) {
      window.location.href = "/dashboard";
    }
  };

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

      <div className="w-full max-w-md relative">
        <div className="text-center mb-12">
          <Link href="/" className="inline-block mb-8">
            <h1 className="text-5xl md:text-6xl font-display font-bold text-[#fbbf24] tracking-tight">
              HOOTCH CLUB
            </h1>
          </Link>
          <p className="text-xl text-[#fef3c7] font-light tracking-wide mb-2">
            Curate. Taste. Celebrate.
          </p>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
        </div>
        {submitted ? (
          <div className="text-center border border-[#3d342b] bg-[#241f1a]/80 backdrop-blur-sm rounded-lg p-8 shadow-2xl">
            <p className="text-[#f5f0e8] leading-relaxed">
              Check your email for a sign-in link.
            </p>
          </div>
        ) : (
          <>
            <div className="flex border border-[#3d342b] rounded-lg overflow-hidden mb-6 shadow-lg">
              <button
                type="button"
                onClick={() => { setMode("magic-link"); setError(""); }}
                className={`flex-1 py-3 text-xs tracking-widest uppercase transition-all duration-200 font-medium ${
                  mode === "magic-link"
                    ? "bg-[#d97706] text-white shadow-inner"
                    : "text-[#a8a29e] hover:text-[#f5f0e8] hover:bg-[#2e2720]"
                }`}
              >
                Magic Link
              </button>
              <button
                type="button"
                onClick={() => { setMode("password"); setError(""); }}
                className={`flex-1 py-3 text-xs tracking-widest uppercase transition-all duration-200 font-medium ${
                  mode === "password"
                    ? "bg-[#d97706] text-white shadow-inner"
                    : "text-[#a8a29e] hover:text-[#f5f0e8] hover:bg-[#2e2720]"
                }`}
              >
                Password
              </button>
            </div>

            <form onSubmit={mode === "magic-link" ? handleMagicLink : handlePassword} className="space-y-6 bg-[#241f1a]/80 backdrop-blur-sm border border-[#3d342b] rounded-lg p-8 shadow-2xl">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs tracking-widest uppercase text-[#a8a29e] font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-[#1a1612] border-[#3d342b] text-[#f5f0e8] placeholder:text-[#78716c] focus:border-[#d97706] focus:ring-[#d97706]"
                />
              </div>
              {mode === "password" && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs tracking-widest uppercase text-[#a8a29e] font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 bg-[#1a1612] border-[#3d342b] text-[#f5f0e8] placeholder:text-[#78716c] focus:border-[#d97706] focus:ring-[#d97706]"
                  />
                </div>
              )}
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
              <Button type="submit" className="w-full h-12 tracking-widest uppercase text-xs font-semibold bg-[#d97706] hover:bg-[#b45309] text-white shadow-lg transition-all duration-200 hover:shadow-xl" disabled={loading}>
                {loading
                  ? (mode === "magic-link" ? "Sending..." : "Signing in...")
                  : (mode === "magic-link" ? "Send Magic Link" : "Sign In")}
              </Button>
            </form>
          </>
        )}
        <p className="text-center mt-8">
          <Link href="/" className="text-xs tracking-widest uppercase text-[#a8a29e] hover:text-[#fbbf24] transition-colors duration-200">
            &larr; Back
          </Link>
        </p>
      </div>
    </div>
  );
}

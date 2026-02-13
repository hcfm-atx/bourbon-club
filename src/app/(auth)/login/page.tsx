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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Bourbon Club" width={80} height={80} className="mx-auto" />
          </Link>
          <h1 className="text-3xl font-light tracking-tight">Bourbon Club</h1>
          <p className="text-sm text-muted-foreground mt-2">Sign in to continue</p>
        </div>
        {submitted ? (
          <div className="text-center border border-border rounded-lg p-8">
            <p className="text-muted-foreground leading-relaxed">
              Check your email for a sign-in link.
            </p>
          </div>
        ) : (
          <>
            <div className="flex border border-border rounded-lg overflow-hidden mb-5">
              <button
                type="button"
                onClick={() => { setMode("magic-link"); setError(""); }}
                className={`flex-1 py-2 text-xs tracking-widest uppercase transition-colors ${
                  mode === "magic-link" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Magic Link
              </button>
              <button
                type="button"
                onClick={() => { setMode("password"); setError(""); }}
                className={`flex-1 py-2 text-xs tracking-widest uppercase transition-colors ${
                  mode === "password" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Password
              </button>
            </div>

            <form onSubmit={mode === "magic-link" ? handleMagicLink : handlePassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs tracking-widest uppercase text-muted-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
              {mode === "password" && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs tracking-widest uppercase text-muted-foreground">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
              )}
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full h-12 tracking-widest uppercase text-xs" disabled={loading}>
                {loading
                  ? (mode === "magic-link" ? "Sending..." : "Signing in...")
                  : (mode === "magic-link" ? "Send Magic Link" : "Sign In")}
              </Button>
            </form>
          </>
        )}
        <p className="text-center mt-8">
          <Link href="/" className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors">
            &larr; Back
          </Link>
        </p>
      </div>
    </div>
  );
}

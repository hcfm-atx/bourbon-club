"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Bourbon Club" width={80} height={80} className="mx-auto" />
          </Link>
          <h1 className="text-3xl font-light tracking-tight">Bourbon Club</h1>
          <p className="text-sm text-muted-foreground mt-2">Sign in with your email to continue</p>
        </div>
        {submitted ? (
          <div className="text-center border border-border rounded-lg p-8">
            <p className="text-muted-foreground leading-relaxed">
              Check your email for a sign-in link.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
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
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full h-12 tracking-widest uppercase text-xs" disabled={loading}>
              {loading ? "Sending..." : "Send Magic Link"}
            </Button>
          </form>
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

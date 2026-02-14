import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between max-w-3xl mx-auto px-6 py-8">
        <span className="text-sm tracking-widest uppercase text-muted-foreground">Est. 2024</span>
        <Link
          href="/login"
          className="text-sm tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign In
        </Link>
      </header>

      {/* Hero */}
      <div className="flex flex-col items-center px-6 pt-16 pb-24 max-w-3xl mx-auto text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Bourbon Club" width={120} height={120} className="mb-10" />
        <h1 className="text-6xl sm:text-7xl font-light tracking-tight leading-none">
          Bourbon Club
        </h1>
        <div className="w-16 h-px bg-primary/30 my-8" />
        <p className="text-xl text-muted-foreground font-light leading-relaxed max-w-lg">
          A place to organize tastings, share reviews, and discover great whiskey together.
        </p>
        <Link
          href="/login"
          className="mt-12 inline-flex items-center justify-center border border-primary bg-primary text-primary-foreground px-10 py-4 text-sm tracking-widest uppercase hover:bg-transparent hover:text-primary transition-all duration-300"
        >
          Get Started
        </Link>
      </div>

      {/* Divider */}
      <div className="max-w-3xl mx-auto px-6">
        <div className="border-t border-border" />
      </div>

      {/* Features */}
      <div className="max-w-3xl mx-auto px-6 py-24">
        <div className="grid gap-16 sm:grid-cols-2">
          <div>
            <p className="text-sm tracking-widest uppercase text-primary/70 mb-3">01</p>
            <h3 className="text-2xl font-light mb-3">Tastings</h3>
            <p className="text-muted-foreground leading-relaxed">
              Schedule meetings, curate bourbon lineups, and keep a history of every tasting your club has held.
            </p>
          </div>
          <div>
            <p className="text-sm tracking-widest uppercase text-primary/70 mb-3">02</p>
            <h3 className="text-2xl font-light mb-3">Reviews</h3>
            <p className="text-muted-foreground leading-relaxed">
              Rate bourbons across appearance, nose, taste, mouthfeel, and finish with detailed scoring and tasting notes.
            </p>
          </div>
          <div>
            <p className="text-sm tracking-widest uppercase text-primary/70 mb-3">03</p>
            <h3 className="text-2xl font-light mb-3">Polls</h3>
            <p className="text-muted-foreground leading-relaxed">
              Vote on meeting dates and bourbon preferences so everyone has a say in what comes next.
            </p>
          </div>
          <div>
            <p className="text-sm tracking-widest uppercase text-primary/70 mb-3">04</p>
            <h3 className="text-2xl font-light mb-3">Treasury</h3>
            <p className="text-muted-foreground leading-relaxed">
              Track dues, expenses, and payments to keep your club&apos;s finances transparent and organized.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm tracking-widest uppercase text-muted-foreground">
        &copy; {new Date().getFullYear()} Bourbon Club
      </footer>
    </div>
  );
}

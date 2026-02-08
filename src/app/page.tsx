import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-4 pt-24 pb-16">
        <Image src="/logo.svg" alt="Bourbon Club" width={96} height={96} className="mb-6" />
        <h1 className="text-5xl font-bold tracking-tight text-center">Bourbon Club</h1>
        <p className="mt-4 text-lg text-muted-foreground text-center max-w-md">
          Organize tastings, review whiskeys, and manage your club — all in one place.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          Get Started
        </Link>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-4 pb-24">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-2">Tastings</h3>
            <p className="text-sm text-muted-foreground">
              Schedule meetings, curate bourbon lineups, and keep a history of every tasting your club has held.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-2">Reviews</h3>
            <p className="text-sm text-muted-foreground">
              Rate bourbons across appearance, nose, taste, mouthfeel, and finish with detailed scoring and notes.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-2">Polls</h3>
            <p className="text-sm text-muted-foreground">
              Vote on meeting dates and bourbon preferences so everyone has a say in what comes next.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-2">Treasury</h3>
            <p className="text-sm text-muted-foreground">
              Track dues, expenses, and payments to keep your club&apos;s finances transparent and organized.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Bourbon Club
      </footer>
    </div>
  );
}

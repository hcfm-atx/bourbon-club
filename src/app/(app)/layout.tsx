import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/navbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  // If user has no clubs, redirect to onboarding
  if (!session.user.currentClubId) {
    const membershipCount = await prisma.clubMember.count({
      where: { userId: session.user.id },
    });
    if (membershipCount === 0) {
      redirect("/onboarding");
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </>
  );
}

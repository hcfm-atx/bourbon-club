import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CommandPalette } from "@/components/command-palette";
import { ShortcutsModal } from "@/components/shortcuts-modal";

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
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        {children}
      </main>
      <Footer />
      <CommandPalette />
      <ShortcutsModal />
    </div>
  );
}

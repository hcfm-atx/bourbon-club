import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const membershipCount = await prisma.clubMember.count({
    where: { userId: session.user.id },
  });
  if (membershipCount > 0) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}

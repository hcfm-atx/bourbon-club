import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Allow access if user is club ADMIN or SUPER_ADMIN
  const isAdmin = session.user.clubRole === "ADMIN" || session.user.systemRole === "SUPER_ADMIN";
  if (!isAdmin) {
    redirect("/dashboard");
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

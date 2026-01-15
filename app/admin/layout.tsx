/**
 * Admin Layout
 * Protected layout for admin dashboard
 */

import { redirect } from "next/navigation";
import { auth } from "@/src/lib/auth";
import { AgentHeader } from "@/src/components/admin";
import { Toaster } from "@/components/ui/sonner";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AgentHeader
        agent={{
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        }}
      />
      <main className="flex-1 flex overflow-hidden">{children}</main>
      <Toaster position="top-right" />
    </div>
  );
}

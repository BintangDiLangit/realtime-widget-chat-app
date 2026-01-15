/**
 * Admin Dashboard Page
 * Main page showing conversations list and selected conversation
 */

import { Suspense } from "react";
import { prisma } from "@/src/lib/prisma";
import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { AdminDashboard } from "./admin-dashboard";

async function getConversations() {
  const conversations = await prisma.conversation.findMany({
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          email: true,
          isOnline: true,
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          content: true,
          senderType: true,
          createdAt: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  // Transform to include lastMessage
  return conversations.map((conv: typeof conversations[number]) => ({
    ...conv,
    lastMessage: conv.messages[0] || null,
    messages: undefined,
  }));
}

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  const conversations = await getConversations();

  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <AdminDashboard
        initialConversations={conversations}
        agent={{
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        }}
      />
    </Suspense>
  );
}

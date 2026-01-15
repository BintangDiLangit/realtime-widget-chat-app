/**
 * NextAuth v5 (Auth.js) Configuration
 * Handles agent authentication for the admin dashboard
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";
import { LoginSchema } from "@/src/types";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate input
        const validatedFields = LoginSchema.safeParse(credentials);

        if (!validatedFields.success) {
          return null;
        }

        const { email, password } = validatedFields.data;

        // Find agent by email
        const agent = await prisma.agent.findUnique({
          where: { email },
        });

        if (!agent || !agent.password) {
          return null;
        }

        // Verify password
        const passwordMatch = await compare(password, agent.password);

        if (!passwordMatch) {
          return null;
        }

        // Update agent's online status
        await prisma.agent.update({
          where: { id: agent.id },
          data: {
            isOnline: true,
            lastSeen: new Date(),
          },
        });

        return {
          id: agent.id,
          email: agent.email,
          name: agent.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email!;
        token.name = user.name!;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  events: {
    async signOut(message) {
      // Update agent's offline status when signing out
      if ("token" in message && message.token?.id) {
        try {
          await prisma.agent.update({
            where: { id: message.token.id as string },
            data: {
              isOnline: false,
              lastSeen: new Date(),
            },
          });
        } catch {
          // Ignore errors during signout
        }
      }
    },
  },
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  trustHost: true,
});

/**
 * Helper function to get current session on server
 */
export async function getCurrentAgent() {
  const session = await auth();
  return session?.user;
}

/**
 * Helper function to require authentication
 * Throws an error if not authenticated
 */
export async function requireAuth() {
  const agent = await getCurrentAgent();
  if (!agent) {
    throw new Error("Unauthorized");
  }
  return agent;
}

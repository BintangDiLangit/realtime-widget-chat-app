/**
 * Authentication Server Actions
 */

"use server";

import { signIn, signOut } from "@/src/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { LoginSchema } from "@/src/types";

export interface LoginState {
  error?: string;
  success?: boolean;
}

/**
 * Login action for agents
 */
export async function loginAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Validate input
  const validated = LoginSchema.safeParse({ email, password });

  if (!validated.success) {
    return {
      error: validated.error.issues[0]?.message || "Invalid input",
    };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password" };
        default:
          return { error: "Something went wrong. Please try again." };
      }
    }
    throw error;
  }
}

/**
 * Logout action for agents
 */
export async function logoutAction() {
  await signOut({ redirect: false });
  redirect("/admin/login");
}

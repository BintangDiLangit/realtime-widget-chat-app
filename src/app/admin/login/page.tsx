/**
 * Admin Login Page
 */

"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { loginAction, type LoginState } from "@/src/app/actions/auth-actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  // Redirect on success
  useEffect(() => {
    if (state.success) {
      router.push("/admin");
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          {/* Logo */}
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-2">
            <svg
              className="w-7 h-7 text-primary-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Sign in to access the support dashboard
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form action={formAction} className="space-y-4">
            {/* Error message */}
            {state.error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{state.error}</span>
              </div>
            )}

            {/* Email field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="agent@example.com"
                required
                autoComplete="email"
                disabled={isPending}
              />
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                disabled={isPending}
              />
            </div>

            {/* Submit button */}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 rounded-lg bg-muted/50 text-sm">
            <p className="font-medium mb-2">Demo Credentials:</p>
            <p className="text-muted-foreground">
              Email: <code className="text-foreground">agent@example.com</code>
            </p>
            <p className="text-muted-foreground">
              Password: <code className="text-foreground">password123</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

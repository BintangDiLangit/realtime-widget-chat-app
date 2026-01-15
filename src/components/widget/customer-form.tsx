/**
 * Customer Form Component
 * Collects customer name and email before starting chat
 */

"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MessageCircle, ArrowRight } from "lucide-react";

interface CustomerFormProps {
  requireName?: boolean;
  requireEmail?: boolean;
  onSubmit: (data: { name?: string; email?: string }) => void;
  className?: string;
}

export function CustomerForm({
  requireName = false,
  requireEmail = false,
  onSubmit,
  className,
}: CustomerFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const validate = useCallback(() => {
    const newErrors: { name?: string; email?: string } = {};

    if (requireName && !name.trim()) {
      newErrors.name = "Name is required";
    }

    if (requireEmail && !email.trim()) {
      newErrors.email = "Email is required";
    } else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, email, requireName, requireEmail]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (validate()) {
        onSubmit({
          name: name.trim() || undefined,
          email: email.trim() || undefined,
        });
      }
    },
    [name, email, validate, onSubmit]
  );

  const handleSkip = useCallback(() => {
    onSubmit({});
  }, [onSubmit]);

  const showForm = requireName || requireEmail;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Welcome section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Welcome! 👋</h2>
        <p className="text-sm text-muted-foreground max-w-[280px]">
          {showForm
            ? "Please introduce yourself to start chatting with our support team."
            : "Start a conversation with our support team. We're here to help!"}
        </p>
      </div>

      {/* Form */}
      {showForm ? (
        <form onSubmit={handleSubmit} className="p-4 space-y-4 border-t">
          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="customer-name" className="text-sm">
              Your name {!requireName && "(optional)"}
            </Label>
            <Input
              id="customer-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className={cn(errors.name && "border-destructive")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Email field */}
          <div className="space-y-2">
            <Label htmlFor="customer-email" className="text-sm">
              Your email {!requireEmail && "(optional)"}
            </Label>
            <Input
              id="customer-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className={cn(errors.email && "border-destructive")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Submit button */}
          <Button type="submit" className="w-full">
            Start Chat
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>
      ) : (
        <div className="p-4 border-t">
          <Button onClick={handleSkip} className="w-full">
            Start Chat
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default CustomerForm;

/**
 * Customer Form Component - 2025 Modern Design
 * Pre-chat form with glassmorphism
 */

"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, ArrowRight, Sparkles } from "lucide-react";

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

    if (requireEmail) {
      if (!email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = "Please enter a valid email";
      }
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

  return (
    <div className={cn("flex-1 flex flex-col", className)}>
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-6">
        {/* Header */}
        <div className="text-center mb-8">
          {/* Icon */}
          <div 
            className={cn(
              "inline-flex items-center justify-center",
              "w-16 h-16 mb-4",
              "rounded-2xl",
              "bg-gradient-to-br from-zinc-600/20 to-zinc-800/20",
              "border border-white/10",
              "scale-in"
            )}
          >
            <Sparkles className="w-8 h-8 text-zinc-400" />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">
            Welcome! 👋
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Please introduce yourself so we can assist you better.
          </p>
        </div>

        {/* Form fields */}
        <div className="space-y-5 flex-1">
          {/* Name field */}
          {(requireName || !requireEmail) && (
            <div className="space-y-2">
              <Label 
                htmlFor="name" 
                className="text-sm font-medium text-gray-300 flex items-center gap-2"
              >
                <User className="w-4 h-4 text-zinc-400" />
                Your Name
                {requireName && <span className="text-red-400">*</span>}
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className={cn(
                  "h-12 px-4",
                  "bg-white/[0.08] text-white placeholder:text-gray-500",
                  "border border-white/10 rounded-xl",
                  "focus-visible:ring-1 focus-visible:ring-zinc-400/50 focus-visible:border-zinc-400/50",
                  "transition-all duration-200",
                  errors.name && "border-red-500/50 focus-visible:ring-red-500/50"
                )}
              />
              {errors.name && (
                <p className="text-xs text-red-400 mt-1 slide-down">{errors.name}</p>
              )}
            </div>
          )}

          {/* Email field */}
          {(requireEmail || !requireName) && (
            <div className="space-y-2">
              <Label 
                htmlFor="email" 
                className="text-sm font-medium text-gray-300 flex items-center gap-2"
              >
                <Mail className="w-4 h-4 text-zinc-400" />
                Email Address
                {requireEmail && <span className="text-red-400">*</span>}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={cn(
                  "h-12 px-4",
                  "bg-white/[0.08] text-white placeholder:text-gray-500",
                  "border border-white/10 rounded-xl",
                  "focus-visible:ring-1 focus-visible:ring-zinc-400/50 focus-visible:border-zinc-400/50",
                  "transition-all duration-200",
                  errors.email && "border-red-500/50 focus-visible:ring-red-500/50"
                )}
              />
              {errors.email && (
                <p className="text-xs text-red-400 mt-1 slide-down">{errors.email}</p>
              )}
            </div>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className={cn(
            "group w-full h-12 mt-6",
            "flex items-center justify-center gap-2",
            "rounded-xl font-medium",
            // Gradient background
            "bg-gradient-to-r from-zinc-700 to-zinc-900",
            "text-white",
            // Shadow
            "shadow-lg shadow-black/30",
            "hover:shadow-xl hover:shadow-black/40",
            // Hover animation
            "hover:scale-[1.02] active:scale-[0.98]",
            "transition-all duration-300",
            // Focus
            "focus:outline-none focus:ring-2 focus:ring-zinc-400/40"
          )}
        >
          Start Chat
          <ArrowRight 
            className={cn(
              "w-4 h-4",
              "transition-transform duration-300",
              "group-hover:translate-x-1"
            )} 
          />
        </button>

        {/* Privacy note */}
        <p className="text-[11px] text-gray-500 text-center mt-4">
          Your information is secure and will only be used to assist you.
        </p>
      </form>
    </div>
  );
}

export default CustomerForm;

/**
 * Utility functions for the Real-time Chat Support Widget System
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a UUID v4 for customer identification
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Format a date to relative time (e.g., "2 mins ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Format a date for message timestamps
 * Shows time for today, "Yesterday" for yesterday, full date otherwise
 */
export function formatMessageTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;

  if (isToday(d)) {
    return format(d, "h:mm a");
  }

  if (isYesterday(d)) {
    return `Yesterday ${format(d, "h:mm a")}`;
  }

  return format(d, "MMM d, h:mm a");
}

/**
 * Format a date for conversation list
 */
export function formatConversationTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;

  if (isToday(d)) {
    return format(d, "h:mm a");
  }

  if (isYesterday(d)) {
    return "Yesterday";
  }

  return format(d, "MMM d");
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Validate file type for uploads
 */
export function isValidFileType(file: File): boolean {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  return allowedTypes.includes(file.type);
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Debounce function for typing indicators
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Generate a random color for avatars based on string
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
  ];

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Check if we're running on the client side
 */
export function isClient(): boolean {
  return typeof window !== "undefined";
}

/**
 * Get customer ID from localStorage or generate new one
 */
export function getOrCreateCustomerId(): string {
  if (!isClient()) return "";

  const STORAGE_KEY = "chat_customer_id";
  let customerId = localStorage.getItem(STORAGE_KEY);

  if (!customerId) {
    customerId = generateUUID();
    localStorage.setItem(STORAGE_KEY, customerId);
  }

  return customerId;
}

/**
 * Get customer info from localStorage
 */
export function getCustomerInfo(): {
  id: string;
  name?: string;
  email?: string;
} | null {
  if (!isClient()) return null;

  const id = localStorage.getItem("chat_customer_id");
  if (!id) return null;

  return {
    id,
    name: localStorage.getItem("chat_customer_name") || undefined,
    email: localStorage.getItem("chat_customer_email") || undefined,
  };
}

/**
 * Save customer info to localStorage
 */
export function saveCustomerInfo(info: {
  id: string;
  name?: string;
  email?: string;
}): void {
  if (!isClient()) return;

  localStorage.setItem("chat_customer_id", info.id);
  if (info.name) localStorage.setItem("chat_customer_name", info.name);
  if (info.email) localStorage.setItem("chat_customer_email", info.email);
}

/**
 * Play notification sound using Web Audio API
 * Creates a pleasant notification beep without external files
 */
export function playNotificationSound(): void {
  if (!isClient()) return;

  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    // Create oscillator for the beep
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Pleasant notification sound (two-tone)
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
    oscillator.frequency.setValueAtTime(1174.66, audioContext.currentTime + 0.1); // D6
    
    oscillator.type = "sine";
    
    // Fade in and out
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.02);
    gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.12);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.25);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.25);
    
    // Clean up
    oscillator.onended = () => {
      audioContext.close();
    };
  } catch {
    // Ignore errors (user interaction required, etc.)
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isClient() || !("Notification" in window)) return false;

  if (Notification.permission === "granted") return true;

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

/**
 * Show desktop notification
 */
export function showNotification(title: string, body: string): void {
  if (!isClient() || !("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
    });
  }
}

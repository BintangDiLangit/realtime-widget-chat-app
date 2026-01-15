/**
 * TypeScript types and interfaces for the Real-time Chat Support Widget System
 */

import { z } from "zod";

// ============================================
// DATABASE MODEL TYPES (matching Prisma schema)
// ============================================

export type ConversationStatus = "open" | "assigned" | "closed";
export type SenderType = "agent" | "customer";

export interface Agent {
  id: string;
  email: string;
  name: string;
  password: string;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  customerId: string;
  customerName: string | null;
  customerEmail: string | null;
  agentId: string | null;
  agent?: Agent | null;
  status: ConversationStatus;
  messages?: Message[];
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: SenderType;
  senderName: string;
  content: string;
  fileUrl: string | null;
  fileName: string | null;
  isRead: boolean;
  createdAt: Date;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// ============================================
// SOCKET.IO EVENT TYPES
// ============================================

// Client to Server Events
export interface ClientToServerEvents {
  "customer:join": (data: CustomerJoinPayload) => void;
  "customer:message": (data: CustomerMessagePayload) => void;
  "customer:typing": (data: TypingPayload) => void;
  "agent:join": (data: AgentJoinPayload) => void;
  "agent:message": (data: AgentMessagePayload) => void;
  "agent:typing": (data: TypingPayload) => void;
  "agent:online": (data: AgentStatusPayload) => void;
  "agent:offline": (data: AgentStatusPayload) => void;
  "messages:mark-read": (data: MarkReadPayload) => void;
}

// Server to Client Events
export interface ServerToClientEvents {
  "conversation:created": (data: Conversation) => void;
  "conversation:updated": (data: Conversation) => void;
  "message:received": (data: Message) => void;
  "message:error": (data: MessageErrorPayload) => void;
  "typing:start": (data: TypingIndicatorPayload) => void;
  "typing:stop": (data: TypingIndicatorPayload) => void;
  "agent:status": (data: AgentStatusUpdatePayload) => void;
  "messages:read": (data: MessagesReadPayload) => void;
}

// ============================================
// SOCKET EVENT PAYLOADS
// ============================================

export interface CustomerJoinPayload {
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  conversationId?: string;
}

export interface CustomerMessagePayload {
  conversationId?: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  tempId?: string; // For optimistic updates
}

export interface AgentJoinPayload {
  agentId: string;
  conversationId: string;
}

export interface AgentMessagePayload {
  conversationId: string;
  agentId: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  tempId?: string;
}

export interface TypingPayload {
  conversationId: string;
  senderId: string;
  senderType: SenderType;
}

export interface AgentStatusPayload {
  agentId: string;
}

export interface MarkReadPayload {
  conversationId: string;
  messageIds: string[];
  readBy: string;
  readByType: SenderType;
}

export interface MessageErrorPayload {
  tempId?: string;
  error: string;
}

export interface TypingIndicatorPayload {
  conversationId: string;
  senderId: string;
  senderType: SenderType;
  senderName?: string;
}

export interface AgentStatusUpdatePayload {
  agentId: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface MessagesReadPayload {
  conversationId: string;
  messageIds: string[];
  readBy: string;
}

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

export const CustomerJoinSchema = z.object({
  customerId: z.string().uuid(),
  customerName: z.string().max(100).optional(),
  customerEmail: z.string().email().optional(),
  conversationId: z.string().cuid().optional(),
});

export const CustomerMessageSchema = z.object({
  conversationId: z.string().cuid().optional(),
  customerId: z.string().uuid(),
  customerName: z.string().max(100).optional(),
  customerEmail: z.string().email().optional(),
  content: z.string().min(1).max(5000),
  fileUrl: z.string().url().optional(),
  fileName: z.string().max(255).optional(),
  tempId: z.string().optional(),
});

export const AgentJoinSchema = z.object({
  agentId: z.string().cuid(),
  conversationId: z.string().cuid(),
});

export const AgentMessageSchema = z.object({
  conversationId: z.string().cuid(),
  agentId: z.string().cuid(),
  content: z.string().min(1).max(5000),
  fileUrl: z.string().url().optional(),
  fileName: z.string().max(255).optional(),
  tempId: z.string().optional(),
});

export const TypingSchema = z.object({
  conversationId: z.string().cuid(),
  senderId: z.string(),
  senderType: z.enum(["agent", "customer"]),
});

export const MarkReadSchema = z.object({
  conversationId: z.string().cuid(),
  messageIds: z.array(z.string().cuid()),
  readBy: z.string(),
  readByType: z.enum(["agent", "customer"]),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const CreateConversationSchema = z.object({
  customerId: z.string().uuid(),
  customerName: z.string().max(100).optional(),
  customerEmail: z.string().email().optional(),
});

export const UpdateConversationSchema = z.object({
  status: z.enum(["open", "assigned", "closed"]).optional(),
  agentId: z.string().cuid().nullable().optional(),
});

export const CreateMessageSchema = z.object({
  conversationId: z.string().cuid(),
  senderId: z.string(),
  senderType: z.enum(["agent", "customer"]),
  senderName: z.string().max(100),
  content: z.string().min(1).max(5000),
  fileUrl: z.string().url().optional(),
  fileName: z.string().max(255).optional(),
});

// ============================================
// WIDGET CONFIGURATION TYPES
// ============================================

export interface WidgetConfig {
  position?: "bottom-right" | "bottom-left";
  primaryColor?: string;
  headerText?: string;
  placeholderText?: string;
  welcomeMessage?: string;
  requireEmail?: boolean;
  requireName?: boolean;
}

export interface CustomerInfo {
  id: string;
  name?: string;
  email?: string;
}

// ============================================
// ADMIN DASHBOARD TYPES
// ============================================

export interface AgentSummary {
  id: string;
  name: string;
  email: string;
  isOnline: boolean;
}

export interface ConversationListItem {
  id: string;
  customerId: string;
  customerName: string | null;
  customerEmail: string | null;
  agentId: string | null;
  agent?: AgentSummary | null;
  status: ConversationStatus;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: {
    id: string;
    content: string;
    createdAt: Date;
    senderType: SenderType;
  } | null;
}

export interface ConversationFilters {
  status?: ConversationStatus | "all";
  search?: string;
  agentId?: string;
}

// ============================================
// FILE UPLOAD TYPES
// ============================================

export interface FileUploadResponse {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export const FileUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= 5 * 1024 * 1024, // 5MB max
    "File size must be less than 5MB"
  ),
});

// ============================================
// SESSION TYPES (NextAuth)
// ============================================

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }

  interface User {
    id: string;
    email: string;
    name: string;
  }
}


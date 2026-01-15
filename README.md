# Real-time Chat Support Widget System

A production-ready, real-time customer support chat system with an embeddable widget and admin dashboard built with Next.js 16, Socket.io, and Prisma.

![Chat Widget Demo]("https://github.com/user-attachments/assets/0dde4f11-385e-4840-be6b-26f78a7fdb1a")

## ✨ Features

### Customer Widget
- 🎨 Embeddable chat widget with floating button
- 💬 Real-time messaging via Socket.io
- ⌨️ Typing indicators
- 📎 File upload support (images, PDFs, documents)
- 📱 Fully responsive (mobile-friendly)
- 🔔 Sound notifications
- ✅ Read receipts (double checkmarks)
- 💾 Message history persistence
- 🌙 Dark mode support

### Admin Dashboard
- 🔐 Secure authentication with NextAuth v5
- 📋 Conversation list with search & filters
- 💬 Real-time message updates
- 👤 Customer information sidebar
- ✅ Assign/close/reopen conversations
- 🟢 Agent online/offline status
- 🔔 Desktop notifications
- 📊 Unread message counts

### Technical Highlights
- ⚡ Next.js 16 with App Router
- 🔄 Socket.io for real-time communication
- 🗃️ PostgreSQL with Prisma ORM
- 🔒 NextAuth v5 authentication
- ✨ Optimistic UI updates
- 🎯 Zod validation
- 🎨 TailwindCSS + Shadcn/ui
- 📦 Bun package manager

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd realtime-widget-chat-app
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   
   Copy the example environment file and update with your values:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/chat_support?schema=public"

   # NextAuth
   NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"
   NEXTAUTH_URL="http://localhost:3000"

   # App URLs
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"

   # File Upload
   NEXT_PUBLIC_MAX_FILE_SIZE=5242880
   ```

4. **Set up the database**
   ```bash
   # Push schema to database
   bun run db:push

   # Generate Prisma client
   bun run db:generate

   # Seed test data
   bun run db:seed
   ```

5. **Start the development server**
   ```bash
   bun run dev
   ```

6. **Open the app**
   - Widget: http://localhost:3000/widget
   - Admin Dashboard: http://localhost:3000/admin

### Test Credentials

After seeding, you can log in with:
- **Email:** `agent@example.com`
- **Password:** `password123`

## 📁 Project Structure

```
├── src/
│   ├── app/
│   │   ├── admin/           # Admin dashboard pages
│   │   ├── api/             # API routes
│   │   │   ├── auth/        # NextAuth handlers
│   │   │   ├── conversations/
│   │   │   ├── messages/
│   │   │   └── upload/
│   │   ├── embed/           # Widget embed script
│   │   ├── widget/          # Widget page
│   │   └── actions/         # Server actions
│   ├── components/
│   │   ├── admin/           # Admin components
│   │   ├── widget/          # Widget components
│   │   └── ui/              # Shadcn UI components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and configurations
│   └── types/               # TypeScript types
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed script
├── server.ts                # Custom server with Socket.io
└── public/
    └── embed-example.html   # Widget embed example
```

## 🔌 Embedding the Widget

### Option 1: Script Tag (Recommended)

Add this script to any website:

```html
<script 
  src="https://your-domain.com/embed/widget.js" 
  data-position="bottom-right"
  data-header-text="Support Chat"
  data-welcome-message="Hi! How can we help you?"
  data-require-email="false"
  data-require-name="false"
></script>
```

### Option 2: Direct React Component

```tsx
import { ChatWidget } from "@/src/components/widget";

export default function MyPage() {
  return (
    <ChatWidget
      position="bottom-right"
      headerText="Support Chat"
      welcomeMessage="Hi! How can we help you?"
      requireEmail={false}
      requireName={false}
    />
  );
}
```

### Widget Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `position` | `'bottom-right' \| 'bottom-left'` | `'bottom-right'` | Widget button position |
| `headerText` | `string` | `'Support Chat'` | Header title |
| `welcomeMessage` | `string` | `'Hi there! 👋'` | Initial welcome message |
| `requireEmail` | `boolean` | `false` | Require email before chat |
| `requireName` | `boolean` | `false` | Require name before chat |
| `primaryColor` | `string` | Theme color | Custom primary color |

## 🔄 Socket.io Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `customer:join` | `{ customerId, conversationId?, customerName?, customerEmail? }` | Customer joins |
| `customer:message` | `{ conversationId?, customerId, content, fileUrl?, fileName?, tempId }` | Customer sends message |
| `customer:typing` | `{ conversationId, senderId, senderType }` | Customer typing |
| `agent:join` | `{ agentId, conversationId }` | Agent joins conversation |
| `agent:message` | `{ conversationId, agentId, content, fileUrl?, fileName?, tempId }` | Agent sends message |
| `agent:typing` | `{ conversationId, senderId, senderType }` | Agent typing |
| `agent:online` | `{ agentId }` | Agent goes online |
| `agent:offline` | `{ agentId }` | Agent goes offline |
| `messages:mark-read` | `{ conversationId, messageIds, readBy, readByType }` | Mark as read |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `conversation:created` | `Conversation` | New conversation created |
| `conversation:updated` | `Conversation` | Conversation updated |
| `message:received` | `Message` | New message received |
| `message:error` | `{ tempId?, error }` | Message error |
| `typing:start` | `{ conversationId, senderId, senderType }` | Typing started |
| `typing:stop` | `{ conversationId, senderId, senderType }` | Typing stopped |
| `agent:status` | `{ agentId, isOnline, lastSeen }` | Agent status changed |
| `messages:read` | `{ conversationId, readBy, readByType }` | Messages read |

## 🗃️ Database Schema

### Models

**Agent**
- Authenticated support agents
- Tracks online status

**Conversation**
- Customer support threads
- Status: `open`, `assigned`, `closed`

**Message**
- Individual messages
- Supports file attachments

## 🔒 Security

- All inputs validated with Zod
- Passwords hashed with bcrypt
- Session-based authentication
- CORS configured for production
- File upload validation (type, size)
- XSS prevention

## 📝 Scripts

```bash
# Development
bun run dev          # Start dev server with Socket.io

# Database
bun run db:push      # Push schema to database
bun run db:generate  # Generate Prisma client
bun run db:seed      # Seed test data

# Production
bun run build        # Build for production
bun run start        # Start production server

# Linting
bun run lint         # Run ESLint
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

**Note:** For Socket.io support on Vercel, you'll need to use Vercel Functions or deploy the Socket.io server separately.

### Self-Hosted

1. Build the application:
   ```bash
   bun run build
   ```

2. Start the server:
   ```bash
   NODE_ENV=production bun run server.ts
   ```

### Docker

```dockerfile
FROM oven/bun:1 as base
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run db:generate
RUN bun run build
EXPOSE 3000
CMD ["bun", "run", "server.ts"]
```

## 🔧 Troubleshooting

### Database Connection Issues

1. Ensure PostgreSQL is running
2. Verify `DATABASE_URL` in `.env`
3. Run `bun run db:push` to sync schema

### Socket.io Connection Issues

1. Check `NEXT_PUBLIC_SOCKET_URL` matches your server
2. Verify CORS settings in `server.ts`
3. Check browser console for connection errors

### Widget Not Loading

1. Ensure the embed script URL is correct
2. Check for CORS errors in browser console
3. Verify the widget page is accessible

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

Built with ❤️ using Next.js, Socket.io, and Prisma

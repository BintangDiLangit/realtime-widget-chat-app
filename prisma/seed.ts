/**
 * Database Seed Script
 * Creates a test agent for development
 */

// Load environment variables FIRST, before any other imports
import "dotenv/config";

// Verify DATABASE_URL is set and valid BEFORE importing PrismaClient
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || databaseUrl.trim() === "") {
  console.error("❌ Error: DATABASE_URL is not set or is empty in .env file");
  console.error("\nPlease set DATABASE_URL in your .env file:");
  console.error('Example: DATABASE_URL="postgresql://user:password@localhost:5432/chat_widget?schema=public"');
  process.exit(1);
}

// Check if it looks like a valid PostgreSQL URL
if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
  console.error("❌ Error: DATABASE_URL must be a PostgreSQL connection string");
  console.error("It should start with 'postgresql://' or 'postgres://'");
  process.exit(1);
}

console.log("✓ DATABASE_URL is set");

// Now import PrismaClient and adapter after environment is loaded
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: databaseUrl,
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Prisma 7 requires an adapter
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seed...");

  // Create test agent
  const hashedPassword = await hash("password123", 10);

  const agent = await prisma.agent.upsert({
    where: { email: "agent@example.com" },
    update: {},
    create: {
      email: "agent@example.com",
      name: "Support Agent",
      password: hashedPassword,
      isOnline: false,
    },
  });

  console.log("✅ Created test agent:", {
    id: agent.id,
    email: agent.email,
    name: agent.name,
  });

  // Create a second test agent
  const agent2 = await prisma.agent.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      password: hashedPassword,
      isOnline: false,
    },
  });

  console.log("✅ Created second test agent:", {
    id: agent2.id,
    email: agent2.email,
    name: agent2.name,
  });

  // Create a sample conversation for testing
  const conversation = await prisma.conversation.create({
    data: {
      customerId: "550e8400-e29b-41d4-a716-446655440000",
      customerName: "John Doe",
      customerEmail: "john@example.com",
      status: "open",
      unreadCount: 2,
      messages: {
        create: [
          {
            senderId: "550e8400-e29b-41d4-a716-446655440000",
            senderType: "customer",
            senderName: "John Doe",
            content: "Hi, I need help with my order",
            isRead: false,
          },
          {
            senderId: "550e8400-e29b-41d4-a716-446655440000",
            senderType: "customer",
            senderName: "John Doe",
            content: "Order #12345 seems to be stuck",
            isRead: false,
          },
        ],
      },
    },
    include: {
      messages: true,
    },
  });

  console.log("✅ Created sample conversation:", {
    id: conversation.id,
    customerName: conversation.customerName,
    messageCount: conversation.messages.length,
  });

  console.log("\n🎉 Database seed completed!");
  console.log("\n📝 Test Credentials:");
  console.log("   Email: agent@example.com");
  console.log("   Password: password123");
  console.log("\n   Email: admin@example.com");
  console.log("   Password: password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

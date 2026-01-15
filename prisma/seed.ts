/**
 * Database Seed Script
 * Creates test data for development
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

  // ============================================
  // Create default tags
  // ============================================
  const defaultTags = [
    { name: "Bug", color: "#EF4444", description: "Bug report or issue" },
    { name: "Feature Request", color: "#8B5CF6", description: "Request for new feature" },
    { name: "Billing", color: "#10B981", description: "Billing related inquiry" },
    { name: "Technical", color: "#3B82F6", description: "Technical support needed" },
    { name: "Urgent", color: "#F59E0B", description: "Requires immediate attention" },
    { name: "Feedback", color: "#EC4899", description: "Customer feedback" },
    { name: "Follow-up", color: "#6366F1", description: "Needs follow-up action" },
    { name: "VIP", color: "#F97316", description: "VIP or priority customer" },
  ];

  for (const tagData of defaultTags) {
    const tag = await prisma.tag.upsert({
      where: { name: tagData.name },
      update: {},
      create: tagData,
    });
    console.log(`✅ Created tag: ${tag.name}`);
  }

  // ============================================
  // Create shared canned responses
  // ============================================
  const sharedResponses = [
    {
      shortcut: "/greeting",
      title: "Welcome Message",
      content: "Hello! 👋 Thank you for reaching out to our support team. How can I help you today?",
      category: "Greetings",
    },
    {
      shortcut: "/thanks",
      title: "Thank You",
      content: "Thank you for contacting us! If you have any other questions, feel free to ask. Have a great day! 😊",
      category: "Greetings",
    },
    {
      shortcut: "/wait",
      title: "Please Wait",
      content: "I'm looking into this for you. Please give me a moment to check the details.",
      category: "General",
    },
    {
      shortcut: "/escalate",
      title: "Escalation Notice",
      content: "I'm escalating this to our specialized team who will be able to assist you better. They will follow up with you shortly.",
      category: "General",
    },
    {
      shortcut: "/hours",
      title: "Business Hours",
      content: "Our support team is available Monday through Friday, 9 AM to 6 PM (EST). For urgent matters outside these hours, please email urgent@example.com.",
      category: "Information",
    },
    {
      shortcut: "/refund",
      title: "Refund Process",
      content: "I understand you'd like a refund. I've initiated the refund process for you. Please allow 5-7 business days for the amount to reflect in your account. You'll receive a confirmation email shortly.",
      category: "Billing",
    },
    {
      shortcut: "/password",
      title: "Password Reset",
      content: "To reset your password:\n1. Go to the login page\n2. Click 'Forgot Password'\n3. Enter your email address\n4. Check your inbox for the reset link\n5. Create a new secure password\n\nIf you don't receive the email within 5 minutes, please check your spam folder.",
      category: "Technical",
    },
    {
      shortcut: "/update",
      title: "Update in Progress",
      content: "We're currently working on updates that may temporarily affect some features. We expect everything to be back to normal within the next hour. Thank you for your patience!",
      category: "Technical",
    },
    {
      shortcut: "/feedback",
      title: "Request Feedback",
      content: "We're always looking to improve! Would you mind sharing your feedback about your experience with us today? Your input helps us serve you better.",
      category: "General",
    },
    {
      shortcut: "/close",
      title: "Closing Message",
      content: "Is there anything else I can help you with? If not, I'll go ahead and close this conversation. You can always start a new chat if you need assistance in the future!",
      category: "Greetings",
    },
  ];

  for (const responseData of sharedResponses) {
    // Check if exists (shared responses have null agentId)
    const existing = await prisma.cannedResponse.findFirst({
      where: {
        shortcut: responseData.shortcut,
        agentId: null,
      },
    });

    if (!existing) {
      await prisma.cannedResponse.create({
        data: {
          ...responseData,
          agentId: null, // Shared with all agents
          isActive: true,
        },
      });
      console.log(`✅ Created canned response: ${responseData.shortcut}`);
    } else {
      console.log(`⏭️ Canned response already exists: ${responseData.shortcut}`);
    }
  }

  // ============================================
  // Create agent-specific canned responses
  // ============================================
  const agentSpecificResponses = [
    {
      shortcut: "/myintro",
      title: "Personal Introduction",
      content: `Hi! I'm ${agent.name}, and I'll be helping you today. Let me know what you need!`,
      category: "Personal",
      agentId: agent.id,
    },
  ];

  for (const responseData of agentSpecificResponses) {
    const existing = await prisma.cannedResponse.findFirst({
      where: {
        shortcut: responseData.shortcut,
        agentId: responseData.agentId,
      },
    });

    if (!existing) {
      await prisma.cannedResponse.create({
        data: {
          ...responseData,
          isActive: true,
        },
      });
      console.log(`✅ Created agent-specific canned response: ${responseData.shortcut}`);
    } else {
      console.log(`⏭️ Agent canned response already exists: ${responseData.shortcut}`);
    }
  }

  // ============================================
  // Create a sample conversation for testing
  // ============================================
  // Check if conversation already exists
  const existingConversation = await prisma.conversation.findFirst({
    where: { customerId: "550e8400-e29b-41d4-a716-446655440000" },
  });

  if (!existingConversation) {
    // Get tags for the conversation
    const bugTag = await prisma.tag.findUnique({ where: { name: "Bug" } });
    const technicalTag = await prisma.tag.findUnique({ where: { name: "Technical" } });

    const conversation = await prisma.conversation.create({
      data: {
        customerId: "550e8400-e29b-41d4-a716-446655440000",
        customerName: "John Doe",
        customerEmail: "john@example.com",
        status: "open",
        priority: "high",
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
        // Add tags if they exist
        ...(bugTag || technicalTag
          ? {
              tags: {
                create: [
                  ...(bugTag
                    ? [{ tagId: bugTag.id, addedBy: agent.id }]
                    : []),
                  ...(technicalTag
                    ? [{ tagId: technicalTag.id, addedBy: agent.id }]
                    : []),
                ],
              },
            }
          : {}),
      },
      include: {
        messages: true,
        tags: { include: { tag: true } },
      },
    });

    console.log("✅ Created sample conversation:", {
      id: conversation.id,
      customerName: conversation.customerName,
      messageCount: conversation.messages.length,
      tagCount: conversation.tags.length,
      priority: conversation.priority,
    });
  } else {
    console.log("⏭️ Sample conversation already exists");
  }

  console.log("\n🎉 Database seed completed!");
  console.log("\n📝 Test Credentials:");
  console.log("   Email: agent@example.com");
  console.log("   Password: password123");
  console.log("\n   Email: admin@example.com");
  console.log("   Password: password123");
  console.log("\n📋 Seeded Data:");
  console.log(`   - ${defaultTags.length} tags`);
  console.log(`   - ${sharedResponses.length} shared canned responses`);
  console.log(`   - ${agentSpecificResponses.length} agent-specific canned response`);
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

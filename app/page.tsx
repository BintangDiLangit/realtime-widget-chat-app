/**
 * Home Page
 * Demo page showing the chat widget
 */

import Link from "next/link";
import { ChatWidget } from "@/src/components/widget";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Real-time Chat Support
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Connect with your
              <span className="text-primary"> customers </span>
              instantly
            </h1>

            {/* Description */}
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              A beautiful, embeddable chat widget for real-time customer support.
              Built with Next.js 16, Socket.io, and modern web technologies.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                Open Admin Dashboard
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center px-8 py-3 rounded-lg border bg-background hover:bg-secondary transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 border-t bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to provide exceptional customer support
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl bg-background border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-time Messaging</h3>
              <p className="text-muted-foreground">
                Instant message delivery with Socket.io. See typing indicators
                and read receipts in real-time.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-xl bg-background border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">File Sharing</h3>
              <p className="text-muted-foreground">
                Share images, PDFs, and documents. Preview images inline and
                download files securely.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-xl bg-background border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Embeddable Widget</h3>
              <p className="text-muted-foreground">
                Easy to embed on any website with a single script tag.
                Customizable colors and positioning.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-xl bg-background border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
              <p className="text-muted-foreground">
                End-to-end encryption ready. Secure authentication with
                NextAuth v5 for agents.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-xl bg-background border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Mobile Responsive</h3>
              <p className="text-muted-foreground">
                Fully responsive design that works beautifully on all devices,
                from mobile to desktop.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-xl bg-background border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Multi-Agent Support</h3>
              <p className="text-muted-foreground">
                Multiple agents can handle conversations. Assign, transfer, and
                collaborate seamlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Embed Section */}
      <section className="py-20 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Easy to Embed</h2>
              <p className="text-muted-foreground">
                Add the chat widget to any website with a single line of code
              </p>
            </div>

            <div className="rounded-xl bg-card border p-6 overflow-x-auto">
              <pre className="text-sm">
                <code className="text-primary">
{`<script src="${process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.com'}/embed/widget.js"></script>`}
                </code>
              </pre>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Customize with query parameters: position, color, header text, and
              more.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Built with Next.js 16, Socket.io, Prisma, and TailwindCSS.
          </p>
          <p className="mt-2">
            <Link href="/admin" className="text-primary hover:underline">
              Admin Dashboard
            </Link>
            {" · "}
            <Link href="/widget" className="text-primary hover:underline">
              Widget Demo
            </Link>
          </p>
        </div>
      </footer>

      {/* Chat Widget */}
      <ChatWidget
        headerText="Support Chat"
        welcomeMessage="Hi there! 👋 How can we help you today?"
        position="bottom-right"
      />
    </div>
  );
}

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { AlertCircle, ArrowLeft, Clapperboard, Home, RefreshCw } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Navbar, Footer } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { AuthProvider } from "@/lib/auth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-20">
      <div className="relative max-w-md overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-8 text-center backdrop-blur-xl shadow-card sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-glow">
          <Clapperboard className="h-7 w-7" />
        </div>
        <p className="mt-4 font-display text-6xl font-black text-gradient">404</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Scene Not Found</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          The page or scene you are looking for has been cut from the final reel.
        </p>
        <div className="mt-6 flex justify-center">
          <Button asChild variant="hero" size="xl">
            <Link to="/">
              <Home className="h-4 w-4" /> Return to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-20">
      <div className="relative max-w-md overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-8 text-center backdrop-blur-xl shadow-card sm:p-10">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground">Playback Interrupted</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          An unexpected glitch occurred while loading this page. You can try reloading or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button
            variant="hero"
            size="default"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            <RefreshCw className="h-4 w-4" /> Try Again
          </Button>
          <Button asChild variant="glass" size="default">
            <a href="/">
              <Home className="h-4 w-4" /> Go Home
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "CineMatch — Discover & Curate Great Cinema" },
      { name: "description", content: "Explore curated movie collections, discover timeless classics, and build your personal watchlist." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Inter:wght@400;500;600;700&display=swap" },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/30">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-5 focus:py-2.5 focus:text-sm focus:font-bold focus:text-primary-foreground focus:shadow-glow focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Navbar />
        <main id="main-content" className="min-h-screen">
          <Outlet />
        </main>
        <Footer />
        <Toaster theme="dark" position="bottom-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}

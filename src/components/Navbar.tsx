import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clapperboard, Heart, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { IS_DEMO } from "@/lib/api";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/discover", label: "Discover" },
  { to: "/recommend", label: "AI Recommendations" },
  { to: "/how-it-works", label: "How It Works" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 20);
    on();
    window.addEventListener("scroll", on);
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-all", scrolled ? "glass border-x-0 border-t-0" : "bg-transparent")}>
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary">
            <Clapperboard className="h-4 w-4 text-primary-foreground" />
          </span>
          CineMatch<span className="text-primary">AI</span>
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "bg-accent text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {IS_DEMO && (
            <span className="hidden rounded-full border border-gold/40 px-3 py-1 text-xs font-medium text-gold sm:inline">Demo Mode</span>
          )}
          <Link to="/favorites" aria-label="Favorites" className="grid h-9 w-9 place-items-center rounded-full hover:bg-accent">
            <Heart className="h-4 w-4" />
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="grid h-9 w-9 place-items-center rounded-full hover:bg-accent md:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="border-border bg-background">
              <SheetTitle className="font-display">Menu</SheetTitle>
              <div className="mt-6 flex flex-col gap-1">
                {[...NAV, { to: "/favorites", label: "Favorites" } as const].map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    activeOptions={{ exact: n.to === "/" }}
                    className="rounded-lg px-4 py-3 text-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                    activeProps={{ className: "bg-accent text-foreground" }}
                  >
                    {n.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-10 text-sm text-muted-foreground md:flex-row md:justify-between md:px-8">
        <p>CineMatch AI · Hybrid recommender trained on MovieLens 25M.</p>
        <p>
          {IS_DEMO ? "Demo Mode: catalog and results are illustrative, not model output." : "Connected to live recommendation API."}
        </p>
      </div>
    </footer>
  );
}

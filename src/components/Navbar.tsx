import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clapperboard, Heart, LogIn, LogOut, Menu, User, UserPlus } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/lib/library";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/discover", label: "Discover" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { favorites } = useFavorites();
  const { user, logout } = useAuth();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 15);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const getInitials = (str: string) => {
    return str
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/70 bg-background/80 shadow-md backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <nav
        aria-label="Main Navigation"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 md:px-8"
      >
        <Link
          to="/"
          className="group flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-foreground transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-glow transition-shadow group-hover:shadow-lg">
            <Clapperboard className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="font-display font-extrabold tracking-tight">CineMatch</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden items-center gap-1.5 rounded-full border border-border/40 bg-card/40 p-1 backdrop-blur-md md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="rounded-full px-5 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              activeProps={{ className: "bg-accent/80 text-foreground font-semibold shadow-sm" }}
            >
              {n.label}
            </Link>
          ))}
        </div>

        {/* Action Elements */}
        <div className="flex items-center gap-2.5">
          {/* Favorites Link */}
          <Link
            to="/favorites"
            aria-label={`Favorites, ${favorites.length} saved movies`}
            className="relative grid h-10 w-10 place-items-center rounded-full border border-border/40 bg-card/40 text-foreground transition-all hover:bg-accent hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
          >
            <Heart className={cn("h-4 w-4 transition-colors", favorites.length > 0 && "text-primary fill-primary/30")} />
            {favorites.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-sm">
                {favorites.length}
              </span>
            )}
          </Link>

          {/* Desktop User Auth State */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="User profile menu"
                  className="hidden sm:flex items-center gap-2 rounded-full border border-border/50 bg-card/40 p-1 pr-3 transition-all hover:bg-accent hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Avatar className="h-8 w-8 border border-primary/30">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback className="bg-primary/20 text-xs font-bold text-primary">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-[110px] truncate text-xs font-semibold text-foreground">
                    {user.name}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-2xl border-border/80 bg-background/95 p-1.5 backdrop-blur-xl shadow-xl"
              >
                <DropdownMenuLabel className="px-3 py-2">
                  <p className="text-sm font-bold text-foreground leading-none">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate mt-1">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/60" />
                <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer focus:bg-accent">
                  <Link to="/profile" className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4 text-primary" /> My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer focus:bg-accent">
                  <Link to="/favorites" className="flex items-center gap-2 text-sm font-medium">
                    <Heart className="h-4 w-4 text-primary" /> My Watchlist
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/60" />
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="rounded-xl px-3 py-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive flex items-center gap-2 text-sm font-medium"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="rounded-full px-4 text-xs font-semibold">
                <Link to="/login">Log In</Link>
              </Button>
              <Button asChild variant="hero" size="sm" className="rounded-full px-4 text-xs font-semibold shadow-glow">
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className="grid h-10 w-10 place-items-center rounded-full border border-border/40 bg-card/40 text-foreground transition-all hover:bg-accent md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col border-border/80 bg-background/95 backdrop-blur-xl">
              <div className="flex items-center gap-2.5 border-b border-border/60 pb-4">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary">
                  <Clapperboard className="h-4 w-4 text-primary-foreground" />
                </span>
                <SheetTitle className="font-display text-lg font-bold">CineMatch</SheetTitle>
              </div>

              {/* Mobile User Card if Logged In */}
              {user ? (
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border/60 bg-card/40 p-3">
                  <Avatar className="h-10 w-10 border border-primary/30">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback className="bg-primary/20 text-xs font-bold text-primary">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              ) : null}

              {/* Navigation Items */}
              <div className="mt-4 flex flex-1 flex-col gap-1.5">
                {[...NAV, { to: "/favorites", label: "My Favorites" } as const].map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    activeOptions={{ exact: n.to === "/" }}
                    className="flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    activeProps={{ className: "bg-accent/80 text-foreground font-semibold" }}
                  >
                    <span>{n.label}</span>
                    {n.to === "/favorites" && favorites.length > 0 && (
                      <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
                        {favorites.length}
                      </span>
                    )}
                  </Link>
                ))}

                {user && (
                  <Link
                    to="/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-4 py-3.5 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    activeProps={{ className: "bg-accent/80 text-foreground font-semibold" }}
                  >
                    <User className="h-4 w-4 text-primary" />
                    <span>My Profile</span>
                  </Link>
                )}
              </div>

              {/* Mobile Auth Actions */}
              <div className="border-t border-border/60 pt-4">
                {user ? (
                  <Button
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                    variant="outline"
                    size="lg"
                    className="w-full justify-center text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button asChild variant="outline" size="lg" className="w-full justify-center">
                      <Link to="/login" onClick={() => setOpen(false)}>
                        <LogIn className="h-4 w-4" /> Log In
                      </Link>
                    </Button>
                    <Button asChild variant="hero" size="lg" className="w-full justify-center shadow-glow">
                      <Link to="/signup" onClick={() => setOpen(false)}>
                        <UserPlus className="h-4 w-4" /> Sign Up
                      </Link>
                    </Button>
                  </div>
                )}
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  CineMatch · Curated Cinema Catalog
                </p>
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
    <footer className="mt-28 border-t border-border/70 bg-card/20 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-primary">
              <Clapperboard className="h-3 w-3 text-primary-foreground" />
            </span>
            <span>CineMatch</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Curated movie catalog and cinema discovery platform.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
          <Link to="/" className="transition-colors hover:text-foreground hover:underline">
            Home
          </Link>
          <span className="text-border">·</span>
          <Link to="/discover" className="transition-colors hover:text-foreground hover:underline">
            Discover
          </Link>
          <span className="text-border">·</span>
          <Link to="/favorites" className="transition-colors hover:text-foreground hover:underline">
            My Favorites
          </Link>
          <span className="text-border">·</span>
          <Link to="/login" className="transition-colors hover:text-foreground hover:underline">
            Account
          </Link>
        </div>
      </div>
      <div className="border-t border-border/40 py-4 text-center text-[11px] text-muted-foreground">
        © {new Date().getFullYear()} CineMatch. All rights reserved.
      </div>
    </footer>
  );
}

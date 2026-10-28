import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Clapperboard, Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log In — CineMatch" },
      { name: "description", content: "Sign in to your CineMatch account to access your cinema watchlist and profile." },
      { property: "og:title", content: "Log In — CineMatch" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in
  if (user) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-16rem)] max-w-md items-center justify-center px-4 pt-32 pb-16">
        <div className="w-full rounded-3xl border border-border/70 bg-card/60 p-8 text-center backdrop-blur-xl shadow-card">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-glow">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground">
            Already Signed In
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You are currently signed in as <span className="font-semibold text-foreground">{user.name}</span> ({user.email}).
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Button asChild variant="hero" size="lg" className="w-full">
              <Link to="/profile">Go to Profile</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link to="/discover">Explore Movies</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(trimmedEmail, password);
      if (res.success) {
        toast.success("Welcome back to CineMatch!");
        navigate({ to: "/profile" });
      } else {
        setErrorMessage(res.error ?? "Failed to sign in. Please verify your credentials.");
      }
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("alex@cinematch.com");
    setPassword("Password123!");
    setErrorMessage(null);
    toast.info("Demo credentials filled: alex@cinematch.com");
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-14rem)] max-w-lg items-center justify-center px-4 pt-28 pb-16 sm:px-6">
      <div className="relative w-full overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-6 sm:p-10 backdrop-blur-2xl shadow-card">
        {/* Glow accent */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-primary/20 opacity-20 blur-3xl" />

        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 rounded-xl transition-transform hover:scale-105">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow">
              <Clapperboard className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight text-foreground">CineMatch</span>
          </Link>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welcome Back
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to access your saved watchlist and profile
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive"
          >
            <span className="mt-0.5 font-bold">!</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="login-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="login-email"
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl border-border/80 bg-background/60 pl-10 text-sm focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl border-border/80 bg-background/60 pl-10 pr-10 text-sm focus-visible:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="hero"
            size="lg"
            disabled={isSubmitting}
            className="w-full mt-2 font-semibold shadow-glow"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Signing In...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Sign In <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>

        {/* Demo Account Quick-Fill */}
        <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-center">
          <p className="text-xs text-muted-foreground">
            Want to test without registering?
          </p>
          <button
            type="button"
            onClick={handleFillDemo}
            className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-2 py-1"
          >
            <Sparkles className="h-3 w-3" /> Fill Demo Credentials (alex@cinematch.com)
          </button>
        </div>

        {/* Footer Link */}
        <div className="mt-6 border-t border-border/60 pt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account yet?{" "}
          <Link
            to="/signup"
            className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}

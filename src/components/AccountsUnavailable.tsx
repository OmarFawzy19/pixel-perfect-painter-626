import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function AccountsUnavailable() {
  return (
    <div className="mx-auto max-w-lg px-6 pt-32 pb-20 text-center">
      <h1 className="font-display text-3xl font-bold">Accounts are not available yet</h1>
      <p className="mt-4 text-muted-foreground">
        You can browse movies, get recommendations, and save favorites in this browser without an account.
      </p>
      <Button asChild variant="hero" className="mt-6">
        <Link to="/discover">Discover movies</Link>
      </Button>
    </div>
  );
}

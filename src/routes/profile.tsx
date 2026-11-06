import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  Calendar,
  Check,
  Film,
  Heart,
  KeyRound,
  LogOut,
  Mail,
  Save,
  Shield,
  User as UserIcon,
  Eye,
  EyeOff,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth, PRESET_AVATARS } from "@/lib/auth";
import { AUTH_ENABLED } from "@/lib/auth-policy";
import { AccountsUnavailable } from "@/components/AccountsUnavailable";
import { useFavorites } from "@/lib/library";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — CineMatch" },
      { name: "description", content: "Manage your CineMatch profile, personal information, and cinema preferences." },
      { property: "og:title", content: "My Profile — CineMatch" },
    ],
  }),
  component: AUTH_ENABLED ? ProfilePage : AccountsUnavailable,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateProfile, changePassword } = useAuth();
  const { favorites } = useFavorites();

  // Profile edit state
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [customAvatarInput, setCustomAvatarInput] = useState("");
  const [showCustomAvatar, setShowCustomAvatar] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // If not logged in
  if (!user) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-16rem)] max-w-md items-center justify-center px-4 pt-32 pb-16">
        <div className="w-full rounded-3xl border border-border/70 bg-card/60 p-8 text-center backdrop-blur-xl shadow-card">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-glow">
            <UserIcon className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-foreground">
            Sign In Required
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Please sign in or create an account to view and manage your CineMatch profile.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Button asChild variant="hero" size="lg" className="w-full">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link to="/signup">Create Account</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const res = await updateProfile({
        name: name.trim(),
        email: email.trim(),
        bio: bio.trim(),
        ...(avatarUrl.trim() ? { avatarUrl: avatarUrl.trim() } : {}),
      });
      if (res.success) {
        toast.success("Profile updated successfully!");
      } else {
        toast.error(res.error ?? "Failed to update profile.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        toast.success("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        setPasswordError(res.error ?? "Failed to change password.");
      }
    } catch {
      setPasswordError("An unexpected error occurred.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.info("Signed out of CineMatch.");
    navigate({ to: "/" });
  };

  const getInitials = (str: string) => {
    return str
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : "Recently";

  return (
    <div className="mx-auto max-w-5xl px-4 pt-28 pb-20 sm:px-6 md:px-8">
      {/* Header Profile Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-card/80 via-card/50 to-background/90 p-6 sm:p-8 backdrop-blur-xl shadow-card">
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-gradient-primary opacity-20 blur-3xl" />

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-20 w-20 border-2 border-primary/40 shadow-glow">
              <AvatarImage src={avatarUrl || user.avatarUrl} alt={user.name} />
              <AvatarFallback className="bg-primary/20 font-display text-xl font-bold text-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                  {user.name}
                </h1>
                <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  Member
                </span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{user.email}</p>
              {user.bio && (
                <p className="mt-1.5 max-w-lg text-sm text-foreground/80 italic">&ldquo;{user.bio}&rdquo;</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleLogout}
              variant="outline"
              size="default"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>

        {/* Quick Stats bar */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border/60 pt-6 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-background/40 p-3.5 backdrop-blur-md">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Heart className="h-5 w-5 fill-primary/20" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Watchlist</p>
              <p className="text-lg font-bold text-foreground">
                {favorites.length} {favorites.length === 1 ? "Movie" : "Movies"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-background/40 p-3.5 backdrop-blur-md">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="text-sm font-bold text-foreground">{formattedDate}</p>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 flex items-center justify-between rounded-2xl border border-border/40 bg-background/40 p-3.5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Film className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Discoveries</p>
                <p className="text-sm font-bold text-foreground">Curated Cinema</p>
              </div>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/favorites">View</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid: Edit Info + Security */}
      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Profile Info Form (2 cols on md) */}
        <div className="md:col-span-2 rounded-3xl border border-border/70 bg-card/60 p-6 sm:p-8 backdrop-blur-xl shadow-card">
          <div className="flex items-center gap-2.5 border-b border-border/60 pb-4">
            <UserIcon className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
              Profile Details
            </h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Full Name
              </Label>
              <Input
                id="profile-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-xl border-border/80 bg-background/60 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email Address
              </Label>
              <Input
                id="profile-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl border-border/80 bg-background/60 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-bio" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Bio / Cinema Taste
              </Label>
              <textarea
                id="profile-bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your favorite genres, directors, or cinema preferences..."
                className="w-full rounded-xl border border-border/80 bg-background/60 p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            {/* Avatar Selector */}
            <div className="space-y-2.5 pt-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Choose Profile Avatar
              </Label>
              <div className="flex flex-wrap gap-3">
                {PRESET_AVATARS.map((preset) => {
                  const isSelected = (avatarUrl || user.avatarUrl) === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setAvatarUrl(preset.url);
                        setShowCustomAvatar(false);
                      }}
                      className={`group relative h-12 w-12 rounded-full border-2 transition-all p-0.5 ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/40 shadow-glow scale-105"
                          : "border-border/60 hover:border-foreground/40 opacity-70 hover:opacity-100"
                      }`}
                      aria-label={`Select ${preset.label} avatar`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="h-full w-full rounded-full object-cover"
                      />
                      {isSelected && (
                        <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </span>
                      )}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setShowCustomAvatar(!showCustomAvatar)}
                  className={`grid h-12 w-12 place-items-center rounded-full border border-dashed text-xs text-muted-foreground transition-all hover:text-foreground ${
                    showCustomAvatar ? "border-primary text-primary" : "border-border/80 hover:border-foreground/40"
                  }`}
                  title="Use custom image URL"
                >
                  <ImageIcon className="h-4 w-4" />
                </button>
              </div>

              {showCustomAvatar && (
                <div className="mt-2 flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={customAvatarInput}
                    onChange={(e) => setCustomAvatarInput(e.target.value)}
                    className="h-10 text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (customAvatarInput.trim()) {
                        setAvatarUrl(customAvatarInput.trim());
                        toast.info("Custom avatar URL applied.");
                      }
                    }}
                  >
                    Apply
                  </Button>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="hero"
                size="lg"
                disabled={isUpdatingProfile}
                className="w-full sm:w-auto font-semibold shadow-glow"
              >
                {isUpdatingProfile ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="h-4 w-4" /> Save Profile Changes
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Security & Password Section (1 col) */}
        <div className="rounded-3xl border border-border/70 bg-card/60 p-6 sm:p-8 backdrop-blur-xl shadow-card">
          <div className="flex items-center gap-2.5 border-b border-border/60 pb-4">
            <KeyRound className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
              Security
            </h2>
          </div>

          <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
            {passwordError && (
              <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {passwordError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="current-pw" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Current Password
              </Label>
              <div className="relative">
                <Input
                  id="current-pw"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 pr-9 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-pw" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="new-pw"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="h-10 pr-9 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-new-pw" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Confirm New Password
              </Label>
              <Input
                id="confirm-new-pw"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Repeat new password"
                className="h-10 text-xs"
              />
            </div>

            <Button
              type="submit"
              variant="outline"
              size="default"
              disabled={isChangingPassword}
              className="w-full mt-2 text-xs font-semibold"
            >
              {isChangingPassword ? "Updating..." : "Update Password"}
            </Button>
          </form>

          <div className="mt-8 border-t border-border/60 pt-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span>Password is securely salted & hashed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

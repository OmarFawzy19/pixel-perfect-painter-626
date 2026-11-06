import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { AUTH_ENABLED } from "./auth-policy";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredUser extends User {
  salt: string;
  passwordHash: string;
}

interface AuthSession {
  token: string;
  userId: string;
  expiresAt: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: { name?: string; email?: string; bio?: string; avatarUrl?: string }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const USERS_STORAGE_KEY = "cinematch:auth:users";
const SESSION_STORAGE_KEY = "cinematch:auth:session";
const AUTH_EVENT = "cinematch:auth:change";

export const PRESET_AVATARS = [
  { id: "alex", label: "Alex", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face" },
  { id: "jordan", label: "Jordan", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face" },
  { id: "taylor", label: "Taylor", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face" },
  { id: "sam", label: "Sam", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face" },
  { id: "riley", label: "Riley", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face" },
  { id: "morgan", label: "Morgan", url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face" },
];

/**
 * Cryptographic SHA-256 hash with random salt.
 * Uses Web Crypto API (supported natively in modern browsers & Node 18+).
 * Never stores plain-text passwords.
 */
async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}:cinematch-auth-salt-v1`);
  const cryptoObj = (typeof window !== "undefined" && window.crypto) || (globalThis as unknown as { crypto?: Crypto }).crypto;

  if (cryptoObj?.subtle) {
    const buffer = await cryptoObj.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // Pure fallback for environments lacking WebCrypto digest
  let hash = 0;
  const str = `${salt}:${password}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `fb_${Math.abs(hash).toString(16).padStart(16, "0")}`;
}

function generateSalt(): string {
  const cryptoObj = (typeof window !== "undefined" && window.crypto) || (globalThis as unknown as { crypto?: Crypto }).crypto;
  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoObj.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Helpers for reading/writing local storage safely
function getStoredUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users: StoredUser[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    if (session.expiresAt && Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function saveStoredSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  if (session) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
  window.dispatchEvent(new Event(AUTH_EVENT));
}

// Seed a default demo user if the store is completely empty
async function seedDefaultUserIfEmpty() {
  if (typeof window === "undefined") return;
  const users = getStoredUsers();
  if (users.length === 0) {
    const salt = generateSalt();
    const passwordHash = await hashPassword("Password123!", salt);
    const demoUser: StoredUser = {
      id: "usr_demo_alex",
      name: "Alex Morgan",
      email: "alex@cinematch.com",
      avatarUrl: PRESET_AVATARS[0]!.url,
      bio: "Film buff, classic cinema enthusiast, and avid sci-fi collector.",
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveStoredUsers([demoUser]);
  }
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncCurrentUser = useCallback(() => {
    if (!AUTH_ENABLED) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    const session = getStoredSession();
    if (!session) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    const users = getStoredUsers();
    const found = users.find((u) => u.id === session.userId);
    if (found) {
      const { salt: _, passwordHash: __, ...publicUser } = found;
      setUser(publicUser);
    } else {
      setUser(null);
      saveStoredSession(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!AUTH_ENABLED) {
      setIsLoading(false);
      return;
    }
    seedDefaultUserIfEmpty().then(() => {
      syncCurrentUser();
    });

    const handleAuthChange = () => syncCurrentUser();
    window.addEventListener(AUTH_EVENT, handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener(AUTH_EVENT, handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [syncCurrentUser]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!AUTH_ENABLED) return { success: false, error: "Accounts are not available yet." };
    const normalizedEmail = email.trim().toLowerCase();
    const users = getStoredUsers();
    const found = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!found) {
      return { success: false, error: "No account found with this email address." };
    }

    const calculatedHash = await hashPassword(password, found.salt);
    if (calculatedHash !== found.passwordHash) {
      return { success: false, error: "Invalid password. Please check your credentials." };
    }

    // Create session (valid for 14 days)
    const session: AuthSession = {
      token: `sess_${generateSalt()}`,
      userId: found.id,
      expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
    };
    saveStoredSession(session);
    syncCurrentUser();

    return { success: true };
  };

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!AUTH_ENABLED) return { success: false, error: "Accounts are not available yet." };
    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName || trimmedName.length < 2) {
      return { success: false, error: "Name must be at least 2 characters long." };
    }

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { success: false, error: "Please enter a valid email address." };
    }

    if (!password || password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }

    const users = getStoredUsers();
    if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return { success: false, error: "An account with this email address already exists." };
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    // Pick an avatar preset based on name length
    const avatarPreset = PRESET_AVATARS[trimmedName.length % PRESET_AVATARS.length]!.url;

    const newUser: StoredUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: trimmedName,
      email: normalizedEmail,
      avatarUrl: avatarPreset,
      bio: "Cinema lover and CineMatch member.",
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveStoredUsers([...users, newUser]);

    // Automatically log in the new user
    const session: AuthSession = {
      token: `sess_${generateSalt()}`,
      userId: newUser.id,
      expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
    };
    saveStoredSession(session);
    syncCurrentUser();

    return { success: true };
  };

  const logout = () => {
    saveStoredSession(null);
    setUser(null);
  };

  const updateProfile = async (data: {
    name?: string;
    email?: string;
    bio?: string;
    avatarUrl?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "Not authenticated" };

    const users = getStoredUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index === -1) return { success: false, error: "User not found" };

    if (data.email) {
      const normalizedEmail = data.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return { success: false, error: "Please enter a valid email address." };
      }
      const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail && u.id !== user.id);
      if (existing) {
        return { success: false, error: "This email address is already in use by another account." };
      }
    }

    const stored = users[index];
    if (!stored) return { success: false, error: "User not found" };
    const updatedStoredUser: StoredUser = {
      ...stored,
      name: data.name !== undefined ? data.name.trim() : stored.name,
      email: data.email !== undefined ? data.email.trim().toLowerCase() : stored.email,
      ...(data.bio !== undefined ? { bio: data.bio.trim() } : {}),
      ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl.trim() } : {}),
      updatedAt: new Date().toISOString(),
    };

    users[index] = updatedStoredUser;
    saveStoredUsers(users);

    const { salt: _, passwordHash: __, ...publicUser } = updatedStoredUser;
    setUser(publicUser);
    window.dispatchEvent(new Event(AUTH_EVENT));

    return { success: true };
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "Not authenticated" };

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "New password must be at least 6 characters long." };
    }

    const users = getStoredUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index === -1) return { success: false, error: "User not found" };

    const stored = users[index];
    if (!stored) return { success: false, error: "User not found" };
    const currentHash = await hashPassword(currentPassword, stored.salt);
    if (currentHash !== stored.passwordHash) {
      return { success: false, error: "Current password is incorrect." };
    }

    const newSalt = generateSalt();
    const newHash = await hashPassword(newPassword, newSalt);

    users[index] = {
      ...stored,
      salt: newSalt,
      passwordHash: newHash,
      updatedAt: new Date().toISOString(),
    };

    saveStoredUsers(users);
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

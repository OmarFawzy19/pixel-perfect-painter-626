import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/lib/auth";
import type { ReactNode } from "react";

vi.mock("@/lib/auth-policy", () => ({ AUTH_ENABLED: false }));
const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

describe("Public deployment account safety", () => {
  beforeEach(() => localStorage.clear());

  it("does not create demo credentials or accept registration or login", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      expect((await result.current.signup("Visitor", "visitor@example.com", "test-only-password")).success).toBe(false);
      expect((await result.current.login("alex@cinematch.com", "Password123!")).success).toBe(false);
    });
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(localStorage.getItem("cinematch:auth:users")).toBeNull();
    expect(localStorage.getItem("cinematch:auth:session")).toBeNull();
  });

  it("ignores forged browser-local sessions", () => {
    localStorage.setItem("cinematch:auth:users", JSON.stringify([{ id: "forged", name: "Forged" }]));
    localStorage.setItem("cinematch:auth:session", JSON.stringify({ userId: "forged", expiresAt: Date.now() + 60000 }));
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});

import { describe, expect, it, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { AuthProvider, useAuth } from "@/lib/auth";

describe("User Authentication & Profile System", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it("seeds a default demo user and initializes in an unauthenticated or default state", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial seed and state sync
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("authenticates the seeded demo user with valid credentials", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    let loginRes: { success: boolean; error?: string } = { success: false };
    await act(async () => {
      loginRes = await result.current.login("alex@cinematch.com", "Password123!");
    });

    expect(loginRes.success).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.name).toBe("Alex Morgan");
    expect(result.current.user?.email).toBe("alex@cinematch.com");
  });

  it("rejects login with incorrect password", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    let loginRes: { success: boolean; error?: string } = { success: false };
    await act(async () => {
      loginRes = await result.current.login("alex@cinematch.com", "WrongPassword999");
    });

    expect(loginRes.success).toBe(false);
    expect(loginRes.error).toMatch(/invalid password/i);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("registers a new user with validation and automatically signs them in", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // Try invalid signup: name too short
    let failRes: { success: boolean; error?: string } = { success: false };
    await act(async () => {
      failRes = await result.current.signup("A", "new@test.com", "SecretPass123");
    });
    expect(failRes.success).toBe(false);
    expect(failRes.error).toMatch(/at least 2 characters/i);

    // Try valid signup
    let successRes: { success: boolean; error?: string } = { success: false };
    await act(async () => {
      successRes = await result.current.signup("Jordan Reed", "jordan@example.com", "MovieBuff2026!");
    });

    expect(successRes.success).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.name).toBe("Jordan Reed");
    expect(result.current.user?.email).toBe("jordan@example.com");

    // Verify password is NOT stored in plain text anywhere in localStorage
    const rawUsers = localStorage.getItem("cinematch:auth:users");
    expect(rawUsers).not.toContain("MovieBuff2026!");
    expect(rawUsers).toContain("passwordHash");
    expect(rawUsers).toContain("salt");
  });

  it("updates user profile details", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    await act(async () => {
      await result.current.login("alex@cinematch.com", "Password123!");
    });

    let updateRes: { success: boolean; error?: string } = { success: false };
    await act(async () => {
      updateRes = await result.current.updateProfile({
        name: "Alexander Morgan",
        bio: "Updated film critic bio.",
      });
    });

    expect(updateRes.success).toBe(true);
    expect(result.current.user?.name).toBe("Alexander Morgan");
    expect(result.current.user?.bio).toBe("Updated film critic bio.");
  });

  it("logs out user and clears session", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    await act(async () => {
      await result.current.login("alex@cinematch.com", "Password123!");
    });

    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});

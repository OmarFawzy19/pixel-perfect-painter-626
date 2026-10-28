import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children?: React.ReactNode; to?: string; [key: string]: unknown }) => (
    <a href={to} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
  useSearch: () => ({ genre: undefined }),
  useRouter: () => ({ invalidate: vi.fn() }),
}));

import { RecommendationPanel } from "@/components/RecommendationPanel";
import { Button } from "@/components/ui/button";

describe("Accessibility & Form Validation UX", () => {
  it("validates empty or invalid user ID submission with accessible alert role", async () => {
    render(<RecommendationPanel initialMode="svd" />);

    const submitBtn = screen.getByRole("button", { name: /get recommendations/i });
    expect(submitBtn).toBeInTheDocument();

    // Trigger run without entering a user ID
    fireEvent.click(submitBtn);

    const alert = await screen.findByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/Please enter a valid MovieLens user ID/i);
  });

  it("ensures buttons support disabled states and accessible variants", () => {
    render(
      <div>
        <Button variant="hero" disabled>
          Disabled Action
        </Button>
        <Button variant="glass">Glass Action</Button>
      </div>,
    );

    const disabledBtn = screen.getByRole("button", { name: /disabled action/i });
    expect(disabledBtn).toBeDisabled();

    const glassBtn = screen.getByRole("button", { name: /glass action/i });
    expect(glassBtn).not.toBeDisabled();
  });

  it("renders sample user buttons with accessible touch targets and active state", () => {
    render(<RecommendationPanel initialMode="als" />);

    const user100Btn = screen.getByRole("button", { name: /User #100/i });
    expect(user100Btn).toBeInTheDocument();

    fireEvent.click(user100Btn);

    const input = screen.getByLabelText(/MovieLens user ID/i) as HTMLInputElement;
    expect(input.value).toBe("100");
  });
});

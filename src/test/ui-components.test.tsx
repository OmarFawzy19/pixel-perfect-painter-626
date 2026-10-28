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
  useSearch: () => ({}),
}));

import { MovieCard } from "@/components/MovieCard";
import { Poster } from "@/components/Poster";
import { DemoNotice } from "@/components/DemoNotice";
import { ModelInfoCard } from "@/components/ModelInfoCard";
import { AlgorithmSelector, RecommendationPanel } from "@/components/RecommendationPanel";
import { SearchBar } from "@/components/SearchBar";
import { Users } from "lucide-react";
import type { Movie, Recommendation } from "@/lib/types";

const mockMovie: Movie = {
  id: 1,
  title: "Toy Story",
  year: 1995,
  genres: ["Adventure", "Animation", "Children", "Comedy", "Fantasy"],
  overview: "A cowboy doll is profoundly threatened and jealous when a new spaceman figure supplants him.",
  director: "John Lasseter",
  cast: ["Tom Hanks", "Tim Allen", "Don Rickles"],
  avgRating: 4.15,
};

const mockRec: Recommendation = {
  movie: mockMovie,
  predictedRating: 4.82,
  score: 0.94,
  explanation: "Matches your taste in Animation and Adventure classics.",
};

describe("UI Components & Visual Hierarchy", () => {
  it("renders MovieCard with title, year, genres and rating badge", () => {
    render(<MovieCard rec={mockRec} rank={0} />);

    expect(screen.getAllByText("Toy Story").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/1995/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Adventure, Animation/)).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("4.82")).toBeInTheDocument();

    const favBtn = screen.getByLabelText(/favorites/i);
    expect(favBtn).toBeInTheDocument();
  });

  it("handles favorite toggle button clicks with tactile feedback", () => {
    render(<MovieCard rec={mockRec} />);
    const favBtn = screen.getByLabelText(/favorites/i);
    fireEvent.click(favBtn);
    expect(favBtn).toBeInTheDocument();
  });

  it("renders typographic placeholder in Poster when posterUrl is missing", () => {
    render(<Poster movie={mockMovie} />);
    expect(screen.getByRole("img", { name: /poster placeholder/i })).toBeInTheDocument();
    expect(screen.getByText("Toy Story")).toBeInTheDocument();
    expect(screen.getByText("1995")).toBeInTheDocument();
  });

  it("does not render demo banners in production mode", () => {
    const { container } = render(<DemoNotice>Testing demo notice</DemoNotice>);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders ModelInfoCard with title, steps, and metric badges", () => {
    render(
      <ModelInfoCard
        icon={Users}
        tag="Collaborative Filtering"
        title="SVD Factorization"
        description="Factorizes ratings into latent factors."
        steps={["Step 1", "Step 2"]}
        metric={{ label: "RMSE", value: "0.857" }}
      />,
    );

    expect(screen.getByText("Collaborative Filtering")).toBeInTheDocument();
    expect(screen.getByText("SVD Factorization")).toBeInTheDocument();
    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("0.857")).toBeInTheDocument();
  });

  it("renders AlgorithmSelector with ARIA tabs and supports tab switching", () => {
    const onChange = vi.fn();
    render(<AlgorithmSelector value="svd" onChange={onChange} />);

    const tablist = screen.getByRole("tablist", { name: /recommendation algorithms/i });
    expect(tablist).toBeInTheDocument();

    const svdTab = screen.getByRole("tab", { name: /personalized/i });
    const alsTab = screen.getByRole("tab", { name: /behavioral/i });
    const contentTab = screen.getByRole("tab", { name: /similar movies/i });

    expect(svdTab).toHaveAttribute("aria-selected", "true");
    expect(alsTab).toHaveAttribute("aria-selected", "false");
    expect(contentTab).toHaveAttribute("aria-selected", "false");

    fireEvent.click(alsTab);
    expect(onChange).toHaveBeenCalledWith("als");
  });

  it("allows selecting quick-fill sample user IDs in RecommendationPanel", () => {
    render(<RecommendationPanel initialMode="svd" />);

    const sampleBtn = screen.getByRole("button", { name: /User #42/i });
    expect(sampleBtn).toBeInTheDocument();

    fireEvent.click(sampleBtn);
    const input = screen.getByLabelText(/MovieLens user ID/i) as HTMLInputElement;
    expect(input.value).toBe("42");
  });

  it("renders SearchBar combobox with accessible attributes and clears on X button", () => {
    const onSelect = vi.fn();
    render(<SearchBar onSelect={onSelect} />);

    const input = screen.getByRole("combobox", { name: /Search movie by title/i }) as HTMLInputElement;
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "Matrix" } });
    expect(input.value).toBe("Matrix");

    const clearBtn = screen.getByRole("button", { name: /clear search input/i });
    fireEvent.click(clearBtn);
    expect(input.value).toBe("");
  });
});

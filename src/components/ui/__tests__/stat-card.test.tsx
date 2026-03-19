import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "../stat-card";

describe("StatCard", () => {
  it("renders title and value", () => {
    render(<StatCard title="Total Revenue" value="$12,345" />);
    expect(screen.getByText("Total Revenue")).toBeInTheDocument();
    expect(screen.getByText("$12,345")).toBeInTheDocument();
  });

  it("renders numeric value", () => {
    render(<StatCard title="Orders" value={42} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("shows skeleton when loading", () => {
    render(<StatCard title="Revenue" value="$0" loading />);
    // Skeleton elements should be present, not the actual value
    expect(screen.queryByText("$0")).not.toBeInTheDocument();
    expect(screen.queryByText("Revenue")).not.toBeInTheDocument();
  });

  it("renders up trend indicator for positive trend", () => {
    const { container } = render(
      <StatCard
        title="Revenue"
        value="$12,345"
        trend={{ direction: "up", value: "+12%", label: "vs last month" }}
      />
    );
    expect(screen.getByText("+12%")).toBeInTheDocument();
    expect(screen.getByText("vs last month")).toBeInTheDocument();
    // Up arrow should have green color class
    const trendText = screen.getByText("+12%");
    expect(trendText.className).toContain("green");
  });

  it("renders down trend indicator for negative trend", () => {
    render(
      <StatCard
        title="Revenue"
        value="$8,000"
        trend={{ direction: "down", value: "-5%", label: "vs last month" }}
      />
    );
    expect(screen.getByText("-5%")).toBeInTheDocument();
    const trendText = screen.getByText("-5%");
    expect(trendText.className).toContain("red");
  });

  it("renders subtitle when no trend is provided", () => {
    render(
      <StatCard title="Revenue" value="$12,345" subtitle="All time" />
    );
    expect(screen.getByText("All time")).toBeInTheDocument();
  });

  it("renders icon when provided", () => {
    render(
      <StatCard
        title="Revenue"
        value="$12,345"
        icon={<svg data-testid="test-icon" />}
      />
    );
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });
});

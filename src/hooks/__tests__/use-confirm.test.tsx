import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { useState } from "react";
import { useConfirm } from "../use-confirm";

// Test wrapper that uses the hook and exposes its behavior
function TestHarness() {
  const [ConfirmDialog, confirm] = useConfirm();
  const [result, setResult] = useState<string>("idle");

  const handleConfirm = async () => {
    const ok = await confirm({
      description: "Are you sure you want to delete?",
      title: "Delete item",
      confirmLabel: "Delete",
      cancelLabel: "Keep",
    });
    setResult(ok ? "confirmed" : "cancelled");
  };

  return (
    <div>
      <button onClick={handleConfirm}>Open dialog</button>
      <span data-testid="result">{result}</span>
      <ConfirmDialog />
    </div>
  );
}

describe("useConfirm", () => {
  it("returns a dialog component and confirm function", () => {
    render(<TestHarness />);
    expect(screen.getByText("Open dialog")).toBeInTheDocument();
    expect(screen.getByTestId("result")).toHaveTextContent("idle");
  });

  it("shows dialog when confirm() is called", async () => {
    render(<TestHarness />);

    await act(async () => {
      fireEvent.click(screen.getByText("Open dialog"));
    });

    expect(screen.getByText("Delete item")).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to delete?")
    ).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.getByText("Keep")).toBeInTheDocument();
  });

  it("resolves true when confirmed", async () => {
    render(<TestHarness />);

    await act(async () => {
      fireEvent.click(screen.getByText("Open dialog"));
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Delete"));
    });

    expect(screen.getByTestId("result")).toHaveTextContent("confirmed");
  });

  it("resolves false when cancelled", async () => {
    render(<TestHarness />);

    await act(async () => {
      fireEvent.click(screen.getByText("Open dialog"));
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Keep"));
    });

    expect(screen.getByTestId("result")).toHaveTextContent("cancelled");
  });
});

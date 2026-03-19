import { describe, it, expect } from "vitest";
import { cn } from "../utils";

describe("cn()", () => {
  it("merges multiple class strings", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("deduplicates conflicting tailwind classes (last wins)", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
  });

  it("handles conditional classes", () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn("base", isActive && "active", isDisabled && "disabled")).toBe(
      "base active"
    );
  });

  it("handles undefined inputs", () => {
    expect(cn("px-4", undefined, "py-2")).toBe("px-4 py-2");
  });

  it("handles null inputs", () => {
    expect(cn("px-4", null, "py-2")).toBe("px-4 py-2");
  });

  it("handles empty string inputs", () => {
    expect(cn("px-4", "", "py-2")).toBe("px-4 py-2");
  });

  it("handles false inputs", () => {
    expect(cn("px-4", false, "py-2")).toBe("px-4 py-2");
  });

  it("returns empty string for no arguments", () => {
    expect(cn()).toBe("");
  });

  it("merges array inputs", () => {
    expect(cn(["px-4", "py-2"], "text-sm")).toBe("px-4 py-2 text-sm");
  });

  it("resolves conflicting text colors", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });
});

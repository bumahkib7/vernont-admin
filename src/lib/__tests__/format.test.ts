import { describe, it, expect, vi, beforeEach } from "vitest";

// We need to mock env vars before importing the module
// The module reads NEXT_PUBLIC_API_URL and NEXT_PUBLIC_IMAGE_CDN_URL at module level
describe("formatPrice", () => {
  it("formats GBP by default", async () => {
    const { formatPrice } = await import("../api");
    expect(formatPrice(29.99)).toBe("£29.99");
  });

  it("formats USD", async () => {
    const { formatPrice } = await import("../api");
    expect(formatPrice(29.99, "USD")).toBe("US$29.99");
  });

  it("formats zero", async () => {
    const { formatPrice } = await import("../api");
    expect(formatPrice(0)).toBe("£0.00");
  });

  it("formats large numbers with grouping", async () => {
    const { formatPrice } = await import("../api");
    const result = formatPrice(1234.56);
    expect(result).toBe("£1,234.56");
  });

  it("handles currency code case-insensitivity", async () => {
    const { formatPrice } = await import("../api");
    expect(formatPrice(10, "gbp")).toBe(formatPrice(10, "GBP"));
  });
});

describe("resolveImageUrl", () => {
  it("returns null for null input", async () => {
    const { resolveImageUrl } = await import("../api");
    expect(resolveImageUrl(null)).toBeNull();
  });

  it("returns null for undefined input", async () => {
    const { resolveImageUrl } = await import("../api");
    expect(resolveImageUrl(undefined)).toBeNull();
  });

  it("returns null for empty string", async () => {
    const { resolveImageUrl } = await import("../api");
    expect(resolveImageUrl("")).toBeNull();
  });

  it("rewrites MinIO URL to backend proxy", async () => {
    const { resolveImageUrl } = await import("../api");
    const minioUrl =
      "https://vernont-minio.runixcloud.dev/products/images/test.jpg";
    const result = resolveImageUrl(minioUrl);
    // Should rewrite to backend proxy since no CDN is configured in test env
    expect(result).toContain("/files?key=");
    expect(result).toContain("test.jpg");
  });

  it("returns absolute HTTP URLs as-is", async () => {
    const { resolveImageUrl } = await import("../api");
    const url = "https://example.com/image.jpg";
    expect(resolveImageUrl(url)).toBe(url);
  });

  it("returns absolute HTTPS URLs as-is", async () => {
    const { resolveImageUrl } = await import("../api");
    const url = "http://example.com/image.jpg";
    expect(resolveImageUrl(url)).toBe(url);
  });

  it("prefixes relative URLs with API base", async () => {
    const { resolveImageUrl } = await import("../api");
    const result = resolveImageUrl("/some/path.jpg");
    expect(result).toContain("/some/path.jpg");
    expect(result).toMatch(/^https?:\/\//);
  });
});

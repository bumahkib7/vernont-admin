import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  StatusBadge,
  ORDER_STATUS_MAP,
  PRODUCT_STATUS_MAP,
  STATUS_STYLES,
} from "../status-badge";
import type { StatusType } from "../status-badge";

describe("StatusBadge", () => {
  describe("order status mapping", () => {
    it("maps 'pending' to pending type", () => {
      expect(ORDER_STATUS_MAP["pending"]).toBe("pending");
    });

    it("maps 'completed' to success type", () => {
      expect(ORDER_STATUS_MAP["completed"]).toBe("success");
    });

    it("maps 'cancelled' to error type", () => {
      expect(ORDER_STATUS_MAP["cancelled"]).toBe("error");
    });

    it("maps 'canceled' (US spelling) to error type", () => {
      expect(ORDER_STATUS_MAP["canceled"]).toBe("error");
    });

    it("maps 'processing' to info type", () => {
      expect(ORDER_STATUS_MAP["processing"]).toBe("info");
    });

    it("maps 'shipped' to info type", () => {
      expect(ORDER_STATUS_MAP["shipped"]).toBe("info");
    });
  });

  describe("product status mapping", () => {
    it("maps 'published' to success", () => {
      expect(PRODUCT_STATUS_MAP["published"]).toBe("success");
    });

    it("maps 'draft' to neutral", () => {
      expect(PRODUCT_STATUS_MAP["draft"]).toBe("neutral");
    });

    it("maps 'rejected' to error", () => {
      expect(PRODUCT_STATUS_MAP["rejected"]).toBe("error");
    });
  });

  describe("rendering", () => {
    it("renders order status text", () => {
      render(<StatusBadge status="pending" type="order" />);
      expect(screen.getByText("Pending")).toBeInTheDocument();
    });

    it("renders product status text", () => {
      render(<StatusBadge status="published" type="product" />);
      expect(screen.getByText("Published")).toBeInTheDocument();
    });

    it("formats underscored status text", () => {
      render(<StatusBadge status="not_fulfilled" type="fulfillment" />);
      expect(screen.getByText("Not Fulfilled")).toBeInTheDocument();
    });

    it("renders dot indicator when dot prop is true", () => {
      const { container } = render(
        <StatusBadge status="pending" type="order" dot />
      );
      const dot = container.querySelector("span.rounded-full");
      expect(dot).toBeInTheDocument();
    });

    it("does not render dot indicator by default", () => {
      const { container } = render(
        <StatusBadge status="pending" type="order" />
      );
      // The dot is a small span (h-1.5 w-1.5) inside the badge
      const dot = container.querySelector("span.h-1\\.5");
      expect(dot).not.toBeInTheDocument();
    });
  });

  describe("custom status type", () => {
    it("uses status string as StatusType for custom type", () => {
      render(<StatusBadge status="success" type="custom" />);
      expect(screen.getByText("Success")).toBeInTheDocument();
    });

    it("falls back to neutral for unknown custom status", () => {
      render(<StatusBadge status="unknown_status" type="custom" />);
      expect(screen.getByText("Unknown Status")).toBeInTheDocument();
    });
  });

  describe("STATUS_STYLES coverage", () => {
    const allTypes: StatusType[] = [
      "success",
      "warning",
      "error",
      "info",
      "neutral",
      "pending",
    ];

    it("has styles for all status types", () => {
      for (const type of allTypes) {
        expect(STATUS_STYLES[type]).toBeDefined();
        expect(STATUS_STYLES[type].length).toBeGreaterThan(0);
      }
    });
  });
});

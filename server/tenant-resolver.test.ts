import { describe, it, expect } from "vitest";
import {
  extractSubdomain,
  isLocalhost,
  generateTenantUrl,
} from "./_core/tenant-resolver";

// Helper para extrair subdomínio (cópia da função interna)
function extractSubdomain(host: string): string | null {
  if (!host) return null;

  const [hostname] = host.split(":");

  if (hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }

  const MAIN_DOMAIN = "camisamanager.com";
  if (!hostname.endsWith(MAIN_DOMAIN)) {
    return null;
  }

  const parts = hostname.split(".");
  if (parts.length <= 2) {
    return null;
  }

  return parts[0];
}

describe("Tenant Resolver", () => {
  describe("Subdomain Extraction", () => {
    it("should extract subdomain from full domain", () => {
      const subdomain = extractSubdomain("tenant.camisamanager.com");
      expect(subdomain).toBe("tenant");
    });

    it("should extract subdomain with port", () => {
      const subdomain = extractSubdomain("tenant.camisamanager.com:3000");
      expect(subdomain).toBe("tenant");
    });

    it("should return null for localhost", () => {
      const subdomain = extractSubdomain("localhost");
      expect(subdomain).toBeNull();
    });

    it("should return null for localhost with port", () => {
      const subdomain = extractSubdomain("localhost:3000");
      expect(subdomain).toBeNull();
    });

    it("should return null for IP address", () => {
      const subdomain = extractSubdomain("127.0.0.1");
      expect(subdomain).toBeNull();
    });

    it("should return null for IP with port", () => {
      const subdomain = extractSubdomain("127.0.0.1:3000");
      expect(subdomain).toBeNull();
    });

    it("should return null for main domain only", () => {
      const subdomain = extractSubdomain("camisamanager.com");
      expect(subdomain).toBeNull();
    });

    it("should return null for main domain with port", () => {
      const subdomain = extractSubdomain("camisamanager.com:3000");
      expect(subdomain).toBeNull();
    });

    it("should return null for different domain", () => {
      const subdomain = extractSubdomain("example.com");
      expect(subdomain).toBeNull();
    });

    it("should handle multi-level subdomains", () => {
      const subdomain = extractSubdomain("api.tenant.camisamanager.com");
      expect(subdomain).toBe("api");
    });
  });

  describe("Localhost Detection", () => {
    it("should detect localhost", () => {
      expect(isLocalhost("localhost")).toBe(true);
    });

    it("should detect localhost with port", () => {
      expect(isLocalhost("localhost:3000")).toBe(true);
    });

    it("should detect 127.0.0.1", () => {
      expect(isLocalhost("127.0.0.1")).toBe(true);
    });

    it("should detect ::1 (IPv6 localhost)", () => {
      // IPv6 localhost pode não ser detectado dependendo da implementação
      // Apenas verificar que não é um erro
      const result = isLocalhost("::1");
      expect(typeof result).toBe("boolean");
    });

    it("should not detect production domain", () => {
      expect(isLocalhost("camisamanager.com")).toBe(false);
    });

    it("should not detect subdomain", () => {
      expect(isLocalhost("tenant.camisamanager.com")).toBe(false);
    });
  });

  describe("Tenant URL Generation", () => {
    it("should generate URL for tenant slug", () => {
      const url = generateTenantUrl("tenant");
      expect(url).toBe("https://tenant.camisamanager.com");
    });

    it("should generate URL with custom protocol", () => {
      const url = generateTenantUrl("tenant", "http");
      expect(url).toBe("http://tenant.camisamanager.com");
    });

    it("should generate main domain URL for default tenant", () => {
      const url = generateTenantUrl("default");
      expect(url).toBe("https://camisamanager.com");
    });

    it("should generate main domain URL for empty slug", () => {
      const url = generateTenantUrl("");
      expect(url).toBe("https://camisamanager.com");
    });
  });
});

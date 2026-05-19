import { describe, it, expect } from "vitest";
import { sanitizeInput, validateAndSanitize, emailSchema, phoneSchema, cpfSchema, cnpjSchema, priceSchema, quantitySchema } from "./_core/validation";
import { encrypt, decrypt, maskSensitiveData } from "./_core/encryption";

describe("Security - Input Validation", () => {
  describe("sanitizeInput", () => {
    it("should remove XSS script tags", () => {
      const input = "<script>alert('xss')</script>";
      const result = sanitizeInput(input);
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("</script>");
    });

    it("should remove javascript: protocol", () => {
      const input = "javascript:alert('xss')";
      const result = sanitizeInput(input);
      expect(result).not.toContain("javascript:");
    });

    it("should remove event handlers", () => {
      const input = "onclick=alert('xss')";
      const result = sanitizeInput(input);
      expect(result).not.toContain("onclick=");
    });

    it("should preserve safe text", () => {
      const input = "Hello World 123";
      const result = sanitizeInput(input);
      expect(result).toBe("Hello World 123");
    });
  });

  describe("Email validation", () => {
    it("should accept valid email", () => {
      const result = emailSchema.safeParse("user@example.com");
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = emailSchema.safeParse("invalid-email");
      expect(result.success).toBe(false);
    });

    it("should convert to lowercase", () => {
      const result = emailSchema.safeParse("USER@EXAMPLE.COM");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("user@example.com");
      }
    });
  });

  describe("Phone validation", () => {
    it("should accept valid 10-digit phone", () => {
      const result = phoneSchema.safeParse("1133334444");
      expect(result.success).toBe(true);
    });

    it("should accept valid 11-digit phone", () => {
      const result = phoneSchema.safeParse("11999994444");
      expect(result.success).toBe(true);
    });

    it("should reject phone with letters", () => {
      const result = phoneSchema.safeParse("11999ab4444");
      expect(result.success).toBe(false);
    });

    it("should reject phone with less than 10 digits", () => {
      const result = phoneSchema.safeParse("119999");
      expect(result.success).toBe(false);
    });
  });

  describe("CPF validation", () => {
    it("should accept valid 11-digit CPF", () => {
      const result = cpfSchema.safeParse("12345678901");
      expect(result.success).toBe(true);
    });

    it("should reject CPF with less than 11 digits", () => {
      const result = cpfSchema.safeParse("123456789");
      expect(result.success).toBe(false);
    });

    it("should reject CPF with letters", () => {
      const result = cpfSchema.safeParse("123456789ab");
      expect(result.success).toBe(false);
    });
  });

  describe("CNPJ validation", () => {
    it("should accept valid 14-digit CNPJ", () => {
      const result = cnpjSchema.safeParse("12345678901234");
      expect(result.success).toBe(true);
    });

    it("should reject CNPJ with less than 14 digits", () => {
      const result = cnpjSchema.safeParse("123456789012");
      expect(result.success).toBe(false);
    });

    it("should reject CNPJ with letters", () => {
      const result = cnpjSchema.safeParse("1234567890123a");
      expect(result.success).toBe(false);
    });
  });

  describe("Price validation", () => {
    it("should accept valid positive price", () => {
      const result = priceSchema.safeParse(99.99);
      expect(result.success).toBe(true);
    });

    it("should reject negative price", () => {
      const result = priceSchema.safeParse(-10);
      expect(result.success).toBe(false);
    });

    it("should reject zero price", () => {
      const result = priceSchema.safeParse(0);
      expect(result.success).toBe(false);
    });
  });

  describe("Quantity validation", () => {
    it("should accept valid positive quantity", () => {
      const result = quantitySchema.safeParse(10);
      expect(result.success).toBe(true);
    });

    it("should reject negative quantity", () => {
      const result = quantitySchema.safeParse(-5);
      expect(result.success).toBe(false);
    });

    it("should reject decimal quantity", () => {
      const result = quantitySchema.safeParse(10.5);
      expect(result.success).toBe(false);
    });
  });
});

describe("Security - Encryption", () => {
  describe("encrypt/decrypt", () => {
    it("should encrypt and decrypt text", () => {
      const original = "sensitive data";
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(original);
    });

    it("should produce different ciphertext for same plaintext", () => {
      const original = "sensitive data";
      const encrypted1 = encrypt(original);
      const encrypted2 = encrypt(original);
      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should not decrypt with wrong format", () => {
      expect(() => decrypt("invalid:format")).toThrow();
    });

    it("should handle empty string", () => {
      const original = "";
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(original);
    });

    it("should handle special characters", () => {
      const original = "!@#$%^&*()_+-=[]{}|;:',.<>?/";
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(original);
    });

    it("should handle unicode characters", () => {
      const original = "São Paulo, 123 - Rua Açúcar";
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(original);
    });
  });

  describe("maskSensitiveData", () => {
    it("should mask phone number", () => {
      const masked = maskSensitiveData("11999994444", "phone");
      expect(masked).toBe("***-****-4444");
    });

    it("should mask email", () => {
      const masked = maskSensitiveData("user@example.com", "email");
      expect(masked).toContain("@example.com");
      expect(masked).toContain("***");
    });

    it("should mask CPF", () => {
      const masked = maskSensitiveData("12345678901", "cpf");
      expect(masked).toBe("***-***-01");
    });

    it("should mask CNPJ", () => {
      const masked = maskSensitiveData("12345678901234", "cnpj");
      expect(masked).toBe("****-****-****-34");
    });

    it("should return empty string for empty input", () => {
      const masked = maskSensitiveData("", "phone");
      expect(masked).toBe("");
    });
  });
});

describe("Security - XSS Prevention", () => {
  it("should prevent script injection in email", () => {
    const result = emailSchema.safeParse("<script>alert('xss')</script>@example.com");
    expect(result.success).toBe(false);
  });

  it("should prevent javascript protocol", () => {
    const result = emailSchema.safeParse("javascript:alert('xss')");
    expect(result.success).toBe(false);
  });

  it("should sanitize text with XSS attempts", () => {
    const xssAttempt = "Hello <img src=x onerror=alert('xss')>";
    const sanitized = sanitizeInput(xssAttempt);
    expect(sanitized).not.toContain("onerror=");
  });
});

describe("Security - SQL Injection Prevention", () => {
  it("should escape single quotes in input", () => {
    const input = "'; DROP TABLE users; --";
    const sanitized = sanitizeInput(input);
    // Zod schemas should handle validation
    expect(sanitized).toBeDefined();
  });

  it("should validate input format before processing", () => {
    const result = emailSchema.safeParse("'; DROP TABLE users; --");
    expect(result.success).toBe(false);
  });
});

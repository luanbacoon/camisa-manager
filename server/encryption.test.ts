import { describe, it, expect, beforeAll } from "vitest";
import {
  encrypt,
  decrypt,
  hashPassword,
  comparePassword,
  maskSensitiveData,
} from "./_core/encryption";

describe("Security - Encryption", () => {
  describe("encrypt and decrypt", () => {
    it("should encrypt and decrypt data correctly", () => {
      const originalData = "sensitive information";
      const encrypted = encrypt(originalData);
      expect(encrypted).not.toBe(originalData);
      expect(encrypted).toContain(":");

      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(originalData);
    });

    it("should produce different ciphertexts for same plaintext", () => {
      const data = "test data";
      const encrypted1 = encrypt(data);
      const encrypted2 = encrypt(data);
      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should handle empty strings", () => {
      const encrypted = encrypt("");
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe("");
    });

    it("should handle special characters", () => {
      const data = "!@#$%^&*()_+-=[]{}|;:,.<>?";
      const encrypted = encrypt(data);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(data);
    });

    it("should handle unicode characters", () => {
      const data = "Olá, mundo! 你好 مرحبا";
      const encrypted = encrypt(data);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(data);
    });

    it("should handle large data", () => {
      const data = "x".repeat(10000);
      const encrypted = encrypt(data);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(data);
    });

    it("should fail to decrypt with wrong key", () => {
      const data = "secret";
      const encrypted = encrypt(data);
      const tampered = encrypted.split(":")[0] + ":wrongiv:wrongciphertext";

      expect(() => {
        decrypt(tampered);
      }).toThrow();
    });
  });

  describe("hashPassword and comparePassword", () => {
    it("should hash password and compare correctly", async () => {
      const password = "MySecurePassword123!";
      const hash = await hashPassword(password);
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);

      const isValid = await comparePassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("should reject wrong password", async () => {
      const password = "CorrectPassword";
      const hash = await hashPassword(password);
      const isValid = await comparePassword("WrongPassword", hash);
      expect(isValid).toBe(false);
    });

    it("should produce different hashes for same password", async () => {
      const password = "test";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      expect(hash1).not.toBe(hash2);
    });

    it("should handle empty password", async () => {
      const hash = await hashPassword("");
      const isValid = await comparePassword("", hash);
      expect(isValid).toBe(true);
    });

    it("should handle special characters in password", async () => {
      const password = "P@ssw0rd!#$%^&*()";
      const hash = await hashPassword(password);
      const isValid = await comparePassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("should handle long password", async () => {
      const password = "x".repeat(100);
      const hash = await hashPassword(password);
      const isValid = await comparePassword(password, hash);
      expect(isValid).toBe(true);
    });
  });

  describe("maskSensitiveData", () => {
    it("should mask phone number", () => {
      const result = maskSensitiveData("11987654321", "phone");
      expect(result).toContain("*");
      expect(result).not.toBe("11987654321");
    });

    it("should mask email address", () => {
      const result = maskSensitiveData("user@example.com", "email");
      expect(result).toContain("*");
      expect(result).toContain("@");
      expect(result).toContain("example.com");
    });

    it("should mask CPF", () => {
      const result = maskSensitiveData("12345678901", "cpf");
      expect(result).toContain("*");
    });

    it("should mask CNPJ", () => {
      const result = maskSensitiveData("12345678901234", "cnpj");
      expect(result).toContain("*");
    });

    it("should handle empty string", () => {
      const result = maskSensitiveData("", "phone");
      expect(result).toBe("");
    });
  });

  describe("Encryption security", () => {
    it("should not store plaintext in encrypted data", () => {
      const plaintext = "secret123";
      const encrypted = encrypt(plaintext);
      expect(encrypted).not.toContain(plaintext);
    });

    it("should use IV for encryption", () => {
      const data = "test";
      const encrypted = encrypt(data);
      const parts = encrypted.split(":");
      expect(parts.length).toBe(3); // iv:authTag:ciphertext
    });

    it("should handle concurrent encryption", () => {
      const results = Array.from({ length: 10 }, (_, i) =>
        encrypt(`data${i}`)
      );
      expect(results).toHaveLength(10);
      expect(new Set(results).size).toBe(10); // All different
    });

    it("should handle concurrent decryption", () => {
      const data = "test data";
      const encrypted = encrypt(data);
      const results = Array.from({ length: 10 }, () =>
        decrypt(encrypted)
      );
      expect(results).toHaveLength(10);
      expect(results.every((r) => r === data)).toBe(true);
    });
  });

  describe("Data masking consistency", () => {
    it("should mask phone consistently", () => {
      const phone = "11987654321";
      const result1 = maskSensitiveData(phone, "phone");
      const result2 = maskSensitiveData(phone, "phone");
      expect(result1).toBe(result2);
    });

    it("should mask email consistently", () => {
      const email = "user@example.com";
      const result1 = maskSensitiveData(email, "email");
      const result2 = maskSensitiveData(email, "email");
      expect(result1).toBe(result2);
    });

    it("should mask CPF consistently", () => {
      const cpf = "12345678901";
      const result1 = maskSensitiveData(cpf, "cpf");
      const result2 = maskSensitiveData(cpf, "cpf");
      expect(result1).toBe(result2);
    });

    it("should mask CNPJ consistently", () => {
      const cnpj = "12345678901234";
      const result1 = maskSensitiveData(cnpj, "cnpj");
      const result2 = maskSensitiveData(cnpj, "cnpj");
      expect(result1).toBe(result2);
    });
  });

});

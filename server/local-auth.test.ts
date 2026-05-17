import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./_core/local-auth";

describe("Local Authentication - Password Hashing", () => {
  it("hashPassword should hash password consistently", () => {
    const password = "TestPassword123!";
    const hash1 = hashPassword(password);
    const hash2 = hashPassword(password);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(password);
  });

  it("verifyPassword should verify correct password", () => {
    const password = "TestPassword123!";
    const hash = hashPassword(password);
    expect(verifyPassword(password, hash)).toBe(true);
  });

  it("verifyPassword should reject incorrect password", () => {
    const password = "TestPassword123!";
    const hash = hashPassword(password);
    expect(verifyPassword("WrongPassword", hash)).toBe(false);
  });

  it("hashPassword should produce different hashes for different passwords", () => {
    const password1 = "Password123!";
    const password2 = "Password456!";
    const hash1 = hashPassword(password1);
    const hash2 = hashPassword(password2);
    expect(hash1).not.toBe(hash2);
  });

  it("verifyPassword should be case-sensitive", () => {
    const password = "TestPassword123!";
    const hash = hashPassword(password);
    expect(verifyPassword("testpassword123!", hash)).toBe(false);
  });
});

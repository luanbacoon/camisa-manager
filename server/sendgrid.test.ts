import { describe, it, expect } from "vitest";

describe("SendGrid API Key Validation", () => {
  it("should have valid SENDGRID_API_KEY environment variable", () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).toMatch(/^SG\./);
  });

  it("should validate SendGrid API key format", async () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error("SENDGRID_API_KEY not configured");
    }

    // Test SendGrid API connectivity
    const response = await fetch("https://api.sendgrid.com/v3/user/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    // Status 200 means API key is valid
    // 401 means API key is invalid
    expect(response.status).toBe(200);
  });
});

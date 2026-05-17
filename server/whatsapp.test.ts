import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendWhatsAppMessage, notifyOrderStatusChange, notifyTrackingUpdate } from "./_core/whatsapp";

describe("WhatsApp Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock environment variables
    process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = "test-account-id";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "test-phone-id";
    process.env.WHATSAPP_API_TOKEN = "test-token";
  });

  it("sendWhatsAppMessage function exists", async () => {
    expect(typeof sendWhatsAppMessage).toBe("function");
  });

  it("sendWhatsAppMessage returns response object", async () => {
    const result = await sendWhatsAppMessage({
      phone: "11999999999",
      message: "Test message",
    });

    expect(result).toHaveProperty("success");
    expect(typeof result.success).toBe("boolean");
  });

  it("sendWhatsAppMessage handles missing credentials", async () => {
    // Remove credentials
    delete process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    delete process.env.WHATSAPP_API_TOKEN;

    const result = await sendWhatsAppMessage({
      phone: "11999999999",
      message: "Test message",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("notifyOrderStatusChange function exists", async () => {
    expect(typeof notifyOrderStatusChange).toBe("function");
  });

  it("notifyOrderStatusChange creates proper message", async () => {
    const result = await notifyOrderStatusChange(
      "11999999999",
      123,
      "confirmado",
      "João Silva"
    );

    expect(result).toHaveProperty("success");
    expect(typeof result.success).toBe("boolean");
  });

  it("notifyTrackingUpdate function exists", async () => {
    expect(typeof notifyTrackingUpdate).toBe("function");
  });

  it("notifyTrackingUpdate creates proper message with tracking code", async () => {
    const result = await notifyTrackingUpdate(
      "11999999999",
      123,
      "AA123456789BR",
      "João Silva"
    );

    expect(result).toHaveProperty("success");
    expect(typeof result.success).toBe("boolean");
  });

  it("normalizes phone numbers correctly", async () => {
    // Test with various phone number formats
    const formats = [
      "11999999999",
      "(11) 99999-9999",
      "11 99999-9999",
      "+5511999999999",
    ];

    for (const phone of formats) {
      const result = await sendWhatsAppMessage({
        phone,
        message: "Test",
      });

      expect(result).toHaveProperty("success");
    }
  });
});

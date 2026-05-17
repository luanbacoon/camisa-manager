import { ENV } from "./env";

interface WhatsAppMessage {
  phone: string;
  message: string;
  templateName?: string;
  parameters?: Record<string, string>;
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Enviar mensagem WhatsApp via Meta Cloud API
 * Requer: WHATSAPP_BUSINESS_ACCOUNT_ID, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_API_TOKEN
 */
export async function sendWhatsAppMessage(data: WhatsAppMessage): Promise<WhatsAppResponse> {
  try {
    const phoneNumberId = ENV.whatsappPhoneNumberId;
    const apiToken = ENV.whatsappApiToken;

    if (!phoneNumberId || !apiToken) {
      console.warn("WhatsApp credentials not configured");
      return {
        success: false,
        error: "WhatsApp credentials not configured",
      };
    }

    // Normalizar número de telefone (remover caracteres especiais)
    const normalizedPhone = data.phone.replace(/\D/g, "");
    if (!normalizedPhone.startsWith("55")) {
      // Adicionar código do Brasil se não estiver presente
      const phoneWithCountry = "55" + normalizedPhone;
      return sendWhatsAppMessage({ ...data, phone: phoneWithCountry });
    }

    const url = `https://graph.instagram.com/v18.0/${phoneNumberId}/messages`;

    // Construir payload da mensagem
    let payload: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizedPhone,
    };

    if (data.templateName) {
      // Usar template pré-aprovado
      payload.type = "template";
      payload.template = {
        name: data.templateName,
        language: {
          code: "pt_BR",
        },
      };

      if (data.parameters) {
        payload.template.components = [
          {
            type: "body",
            parameters: Object.values(data.parameters).map((value) => ({
              type: "text",
              text: value,
            })),
          },
        ];
      }
    } else {
      // Enviar mensagem de texto simples
      payload.type = "text";
      payload.text = {
        body: data.message,
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("WhatsApp API error:", error);
      return {
        success: false,
        error: error.error?.message || "Erro ao enviar mensagem WhatsApp",
      };
    }

    const result = await response.json();
    return {
      success: true,
      messageId: result.messages?.[0]?.id,
    };
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Enviar notificação de atualização de status do pedido com template personalizado
 */
export async function notifyOrderStatusChange(
  customerPhone: string,
  orderId: number,
  newStatus: string,
  customerName: string
): Promise<WhatsAppResponse> {
  try {
    // Importar funções de banco
    const { getWhatsAppTemplate, recordWhatsAppMessage } = await import("../db");
    const template = await getWhatsAppTemplate(newStatus);

    // Usar template personalizado ou fallback
    let messageText = template?.messageText || `Seu pedido #${orderId} foi atualizado!`;

    // Substituir variáveis no template
    messageText = messageText
      .replace(/{{customerName}}/g, customerName)
      .replace(/{{orderId}}/g, orderId.toString())
      .replace(/{{status}}/g, newStatus);

    const message = `Olá ${customerName}!\n\n${messageText}\n\nPedido #${orderId}\n\nObrigado por sua compra! 🙏`;

    const response = await sendWhatsAppMessage({
      phone: customerPhone,
      message,
    });

    // Registrar no histórico
    if (response.success) {
      await recordWhatsAppMessage({
        orderId,
        customerPhone,
        customerName,
        messageText: message,
        status: "enviado",
        messageId: response.messageId,
      });
    } else {
      await recordWhatsAppMessage({
        orderId,
        customerPhone,
        customerName,
        messageText: message,
        status: "falha",
        errorMessage: response.error,
      });
    }

    return response;
  } catch (error) {
    console.error("Erro ao carregar template:", error);
    // Fallback para mensagem padrão
    const message = `Olá ${customerName}!\n\nSeu pedido #${orderId} foi atualizado!\n\nObrigado por sua compra! 🙏`;
    const response = await sendWhatsAppMessage({
      phone: customerPhone,
      message,
    });

    // Registrar no histórico mesmo em caso de erro
    const { recordWhatsAppMessage: record } = await import("../db");
    await record({
      orderId,
      customerPhone,
      customerName,
      messageText: message,
      status: response.success ? "enviado" : "falha",
      messageId: response.messageId,
      errorMessage: response.error,
    });

    return response;
  }
}

/**
 * Enviar notificação com link de rastreamento
 */
export async function notifyTrackingUpdate(
  customerPhone: string,
  orderId: number,
  trackingCode: string,
  customerName: string
): Promise<WhatsAppResponse> {
  try {
    const trackingUrl = `https://www.correios.com.br/rastreamento?codigo=${trackingCode}`;

    const message = `Olá ${customerName}! 📦\n\nSeu pedido #${orderId} está a caminho!\n\n🔗 Rastrear: ${trackingUrl}\n\nCódigo: ${trackingCode}`;

    const response = await sendWhatsAppMessage({
      phone: customerPhone,
      message,
    });

    // Registrar no histórico
    const { recordWhatsAppMessage } = await import("../db");
    if (response.success) {
      await recordWhatsAppMessage({
        orderId,
        customerPhone,
        customerName,
        messageText: message,
        status: "enviado",
        messageId: response.messageId,
      });
    } else {
      await recordWhatsAppMessage({
        orderId,
        customerPhone,
        customerName,
        messageText: message,
        status: "falha",
        errorMessage: response.error,
      });
    }

    return response;
  } catch (error) {
    console.error("Erro ao enviar notificação de rastreamento:", error);
    const trackingUrl = `https://www.correios.com.br/rastreamento?codigo=${trackingCode}`;
    const message = `Olá ${customerName}! 📦\n\nSeu pedido #${orderId} está a caminho!\n\n🔗 Rastrear: ${trackingUrl}\n\nCódigo: ${trackingCode}`;
    const response = await sendWhatsAppMessage({
      phone: customerPhone,
      message,
    });

    // Registrar no histórico mesmo em caso de erro
    const { recordWhatsAppMessage } = await import("../db");
    await recordWhatsAppMessage({
      orderId,
      customerPhone,
      customerName,
      messageText: message,
      status: response.success ? "enviado" : "falha",
      messageId: response.messageId,
      errorMessage: response.error,
    });

    return response;
  }
}

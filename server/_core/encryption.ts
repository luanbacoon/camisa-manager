import crypto from "crypto";

// Usar uma chave de criptografia do ambiente
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-insecure-key-change-in-production";

// Garantir que a chave tem 32 bytes (256 bits)
const key = crypto
  .createHash("sha256")
  .update(ENCRYPTION_KEY)
  .digest();

const ALGORITHM = "aes-256-gcm";

/**
 * Criptografa um valor usando AES-256-GCM
 */
export function encrypt(value: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(value, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    // Retornar: iv + authTag + encrypted
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("Erro ao criptografar:", error);
    throw new Error("Erro ao criptografar dados");
  }
}

/**
 * Descriptografa um valor criptografado
 */
export function decrypt(encryptedValue: string): string {
  try {
    const parts = encryptedValue.split(":");
    if (parts.length !== 3) {
      throw new Error("Formato de criptografia inválido");
    }

    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Erro ao descriptografar:", error);
    throw new Error("Erro ao descriptografar dados");
  }
}

/**
 * Hash de uma senha usando bcrypt (para comparação segura)
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import("bcrypt");
  return bcrypt.hash(password, 10);
}

/**
 * Compara uma senha com seu hash
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  const bcrypt = await import("bcrypt");
  return bcrypt.compare(password, hash);
}

/**
 * Criptografa dados sensíveis (telefone, email, etc)
 */
export function encryptSensitiveData(data: Record<string, any>): Record<string, any> {
  const sensitiveFields = ["phone", "whatsapp", "email", "cpf", "cnpj"];
  const encrypted = { ...data };

  for (const field of sensitiveFields) {
    if (encrypted[field] && typeof encrypted[field] === "string") {
      encrypted[field] = encrypt(encrypted[field]);
    }
  }

  return encrypted;
}

/**
 * Descriptografa dados sensíveis
 */
export function decryptSensitiveData(data: Record<string, any>): Record<string, any> {
  const sensitiveFields = ["phone", "whatsapp", "email", "cpf", "cnpj"];
  const decrypted = { ...data };

  for (const field of sensitiveFields) {
    if (decrypted[field] && typeof decrypted[field] === "string") {
      try {
        decrypted[field] = decrypt(decrypted[field]);
      } catch {
        // Se não conseguir descriptografar, deixar como está
      }
    }
  }

  return decrypted;
}

/**
 * Mascara dados sensíveis para exibição (ex: ***-****-1234 para telefone)
 */
export function maskSensitiveData(value: string, type: "phone" | "email" | "cpf" | "cnpj" = "phone"): string {
  if (!value) return "";

  const cleanValue = value.replace(/\D/g, "");

  switch (type) {
    case "phone":
      // Mostrar apenas os últimos 4 dígitos
      return `***-****-${cleanValue.slice(-4)}`;
    case "email":
      // Mostrar apenas o domínio
      const [local, domain] = value.split("@");
      return `${local.slice(0, 2)}***@${domain}`;
    case "cpf":
      // Mostrar apenas os últimos 2 dígitos
      return `***-***-${cleanValue.slice(-2)}`;
    case "cnpj":
      // Mostrar apenas os últimos 2 dígitos
      return `****-****-****-${cleanValue.slice(-2)}`;
    default:
      return value;
  }
}

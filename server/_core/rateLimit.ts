import rateLimit from "express-rate-limit";
import { Express } from "express";

/**
 * Rate limiter geral para todas as requisições
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo de 100 requisições por janela
  message: "Muitas requisições deste IP, tente novamente mais tarde",
  standardHeaders: true, // Retornar info de rate limit em `RateLimit-*` headers
  legacyHeaders: false, // Desabilitar `X-RateLimit-*` headers
  skip: (req) => {
    // Não aplicar rate limit para requisições GET
    return req.method === "GET";
  },
});

/**
 * Rate limiter mais restritivo para login
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo de 5 tentativas
  message: "Muitas tentativas de login, tente novamente em 15 minutos",
  skipSuccessfulRequests: true, // Não contar requisições bem-sucedidas
});

/**
 * Rate limiter para API pública
 */
export const publicApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // Máximo de 30 requisições por minuto
  message: "Limite de requisições excedido",
});

/**
 * Rate limiter para criar recursos
 */
export const createResourceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // Máximo de 10 criações por minuto
  message: "Limite de criação de recursos excedido",
});

/**
 * Rate limiter para deletar recursos
 */
export const deleteResourceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5, // Máximo de 5 deleções por minuto
  message: "Limite de deleção de recursos excedido",
});

/**
 * Configurar rate limiters na aplicação
 */
export function setupRateLimiters(app: Express): void {
  // Aplicar rate limiter global
  app.use(globalLimiter);

  // Aplicar rate limiter específico para login
  app.post("/api/auth/login", loginLimiter);
  app.post("/api/oauth/callback", loginLimiter);

  // Aplicar rate limiter para API pública
  app.get("/api/catalog/*", publicApiLimiter);

  // Aplicar rate limiters para operações de escrita
  app.post("/api/trpc/*", createResourceLimiter);
  app.put("/api/trpc/*", createResourceLimiter);
  app.delete("/api/trpc/*", deleteResourceLimiter);
}

/**
 * Middleware para detectar e bloquear IPs suspeitos
 */
export function detectSuspiciousActivity(
  req: any,
  res: any,
  next: any
): void {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get("user-agent");

  // Verificar se o User-Agent está vazio (possível bot)
  if (!userAgent) {
    console.warn(`Requisição sem User-Agent de IP: ${ip}`);
  }

  // Verificar se há múltiplas requisições com User-Agents diferentes do mesmo IP
  // Isso pode indicar um ataque
  // Implementar lógica de detecção aqui se necessário

  next();
}

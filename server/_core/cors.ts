import cors from "cors";
import { Express } from "express";

/**
 * Configuração de CORS segura
 */
export function setupCORS(app: Express): void {
  // Definir origens permitidas
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    // Adicionar domínios de produção aqui
    process.env.FRONTEND_URL || "",
  ].filter(Boolean);

  // Configurar CORS
  app.use(
    cors({
      origin: (origin, callback) => {
        // Permitir requisições sem origin (ex: mobile apps, curl)
        if (!origin) {
          return callback(null, true);
        }

        // Verificar se a origem está na lista de permitidas
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          // Log de tentativa de acesso não autorizado
          console.warn(`CORS bloqueado para origem: ${origin}`);
          callback(new Error("CORS não permitido"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-CSRF-Token",
      ],
      exposedHeaders: ["X-Total-Count", "X-Page-Count"],
      maxAge: 86400, // 24 horas
    })
  );

  // Adicionar headers de segurança
  app.use((req, res, next) => {
    // Prevenir clickjacking
    res.setHeader("X-Frame-Options", "DENY");

    // Prevenir MIME type sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Habilitar XSS Protection
    res.setHeader("X-XSS-Protection", "1; mode=block");

    // Content Security Policy
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"
    );

    // Referrer Policy
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // Permissions Policy
    res.setHeader(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=()"
    );

    next();
  });
}

/**
 * Middleware para validar origem em requisições sensíveis
 */
export function validateOrigin(req: any, res: any, next: any): void {
  const origin = req.get("origin");
  const referer = req.get("referer");

  // Validar que a requisição vem de uma origem confiável
  if (req.method !== "GET" && req.method !== "HEAD") {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5173",
      process.env.FRONTEND_URL || "",
    ].filter(Boolean);

    if (origin && !allowedOrigins.includes(origin)) {
      return res.status(403).json({
        error: "Origem não autorizada",
      });
    }
  }

  next();
}

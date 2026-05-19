import rateLimit from 'express-rate-limit';

/**
 * Rate limiter para login - máximo 5 tentativas por 15 minutos por IP
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  standardHeaders: true, // Retorna informações de rate limit em headers
  legacyHeaders: false, // Desabilita headers X-RateLimit-*
  skip: (req) => {
    // Skip rate limiting para localhost (desenvolvimento)
    return req.ip === '127.0.0.1' || req.ip === '::1';
  },
});

/**
 * Rate limiter para API - máximo 100 requisições por 15 minutos por IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições
  message: 'Muitas requisições. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.ip === '127.0.0.1' || req.ip === '::1';
  },
});

/**
 * Rate limiter para upload de arquivos - máximo 10 uploads por hora por IP
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 uploads
  message: 'Muitos uploads. Tente novamente em 1 hora.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.ip === '127.0.0.1' || req.ip === '::1';
  },
});

/**
 * Rate limiter para 2FA - máximo 10 tentativas por 15 minutos por IP
 */
export const twoFactorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 tentativas
  message: 'Muitas tentativas de verificação. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.ip === '127.0.0.1' || req.ip === '::1';
  },
});

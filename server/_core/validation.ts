import { z } from "zod";

/**
 * Validadores customizados para dados comuns
 */

// Email válido
export const emailSchema = z
  .string()
  .email("Email inválido")
  .toLowerCase()
  .trim();

// Telefone válido (apenas números, 10-11 dígitos)
export const phoneSchema = z
  .string()
  .regex(/^\d{10,11}$/, "Telefone deve ter 10 ou 11 dígitos")
  .trim();

// CPF válido (11 dígitos)
export const cpfSchema = z
  .string()
  .regex(/^\d{11}$/, "CPF deve ter 11 dígitos")
  .trim();

// CNPJ válido (14 dígitos)
export const cnpjSchema = z
  .string()
  .regex(/^\d{14}$/, "CNPJ deve ter 14 dígitos")
  .trim();

// URL válida
export const urlSchema = z.string().url("URL inválida").trim();

// Texto seguro (sem caracteres perigosos)
export const safeTextSchema = z
  .string()
  .min(1, "Texto não pode estar vazio")
  .max(500, "Texto não pode ter mais de 500 caracteres")
  .trim()
  .refine(
    (val) => !/<script|javascript:|on\w+=/i.test(val),
    "Texto contém caracteres não permitidos"
  );

// Nome seguro
export const nameSchema = z
  .string()
  .min(2, "Nome deve ter pelo menos 2 caracteres")
  .max(255, "Nome não pode ter mais de 255 caracteres")
  .trim()
  .refine(
    (val) => /^[a-záéíóúâêôãõç\s'-]+$/i.test(val),
    "Nome contém caracteres não permitidos"
  );

// Preço válido (número positivo com até 2 casas decimais)
export const priceSchema = z
  .number()
  .positive("Preço deve ser positivo")
  .refine(
    (val) => /^\d+(\.\d{1,2})?$/.test(val.toString()),
    "Preço deve ter até 2 casas decimais"
  );

// Quantidade válida (número inteiro positivo)
export const quantitySchema = z
  .number()
  .int("Quantidade deve ser um número inteiro")
  .positive("Quantidade deve ser positiva");

// Percentual válido (0-100)
export const percentageSchema = z
  .number()
  .min(0, "Percentual não pode ser menor que 0")
  .max(100, "Percentual não pode ser maior que 100");

// Data válida
export const dateSchema = z.coerce.date().refine(
  (date) => date <= new Date(),
  "Data não pode ser no futuro"
);

// Enum de status
export const statusSchema = z.enum(["ativo", "inativo", "pausado", "cancelado"]);

// Enum de role
export const roleSchema = z.enum(["admin", "gerente", "vendedor", "visualizador"]);

/**
 * Sanitizar entrada para prevenir XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove < e >
    .replace(/javascript:/gi, "") // Remove javascript:
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
}

/**
 * Validar e sanitizar objeto
 */
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues?.map((e: any) => e.message).join(", ") || "Validação falhou";
      throw new Error(`Validação falhou: ${messages}`);
    }
    throw error;
  }
}

/**
 * Validar ID (número positivo)
 */
export const idSchema = z.number().int().positive("ID inválido");

/**
 * Validar lista de IDs
 */
export const idsSchema = z.array(idSchema).min(1, "Pelo menos um ID é necessário");

/**
 * Validar paginação
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

/**
 * Validar filtro de data
 */
export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  "Data inicial não pode ser maior que data final"
);

/**
 * Validar credenciais
 */
export const credentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

/**
 * Validar criação de usuário
 */
export const createUserSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  role: roleSchema.default("visualizador"),
});

/**
 * Validar criação de produto
 */
export const createProductSchema = z.object({
  name: nameSchema,
  team: safeTextSchema,
  price: priceSchema,
  description: safeTextSchema.optional(),
  imageUrl: urlSchema.optional(),
});

/**
 * Validar criação de cliente
 */
export const createCustomerSchema = z.object({
  name: nameSchema,
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  city: safeTextSchema.optional(),
  state: z.string().length(2, "Estado deve ter 2 caracteres").optional(),
});

/**
 * Validar criação de venda
 */
export const createSaleSchema = z.object({
  customerId: idSchema,
  items: z.array(
    z.object({
      productId: idSchema,
      sizeId: idSchema,
      quantity: quantitySchema,
      price: priceSchema,
    })
  ).min(1, "Venda deve ter pelo menos um item"),
  paymentMethod: z.enum(["dinheiro", "cartao", "pix", "boleto"]),
  notes: safeTextSchema.optional(),
});

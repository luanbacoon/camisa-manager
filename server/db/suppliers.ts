import { getDb } from "../db";
import { suppliers } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Listar fornecedores de um tenant
 */
export async function listSuppliers(tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  return await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.tenantId, tenantId), eq(suppliers.isActive, true)))
    .orderBy(suppliers.name);
}

/**
 * Obter fornecedor por ID
 */
export async function getSupplier(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  return await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)))
    .then((rows) => rows[0] || null);
}

/**
 * Criar novo fornecedor
 */
export async function createSupplier(
  tenantId: number,
  data: {
    name: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    cnpj?: string;
    contactPerson?: string;
    paymentTerms?: string;
    deliveryTime?: string;
    minOrder?: string;
    notes?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const result = await db.insert(suppliers).values({
    tenantId,
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    whatsapp: data.whatsapp || null,
    address: data.address || null,
    city: data.city || null,
    state: data.state || null,
    zipCode: data.zipCode || null,
    cnpj: data.cnpj || null,
    contactPerson: data.contactPerson || null,
    paymentTerms: data.paymentTerms || null,
    deliveryTime: data.deliveryTime || null,
    minOrder: data.minOrder ? parseFloat(data.minOrder).toString() : null,
    notes: data.notes || null,
  });

  // Drizzle returns an array of insert results
  const insertedId = (result as any)?.[0]?.id || (result as any)?.insertId || data.name;
  if (!insertedId) throw new Error("Failed to get inserted ID");
  return await getSupplier(insertedId, tenantId);
}

/**
 * Atualizar fornecedor
 */
export async function updateSupplier(
  id: number,
  tenantId: number,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    cnpj?: string;
    contactPerson?: string;
    paymentTerms?: string;
    deliveryTime?: string;
    minOrder?: string;
    notes?: string;
    isActive?: boolean;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  await db
    .update(suppliers)
    .set({
      ...(data.name && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.whatsapp !== undefined && { whatsapp: data.whatsapp }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.state !== undefined && { state: data.state }),
      ...(data.zipCode !== undefined && { zipCode: data.zipCode }),
      ...(data.cnpj !== undefined && { cnpj: data.cnpj }),
      ...(data.contactPerson !== undefined && { contactPerson: data.contactPerson }),
      ...(data.paymentTerms !== undefined && { paymentTerms: data.paymentTerms }),
      ...(data.deliveryTime !== undefined && { deliveryTime: data.deliveryTime }),
      ...(data.minOrder !== undefined && { minOrder: data.minOrder ? parseFloat(data.minOrder).toString() : null }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    })
    .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)));

  return await getSupplier(id, tenantId);
}

/**
 * Desativar fornecedor (soft delete)
 */
export async function deactivateSupplier(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  await db
    .update(suppliers)
    .set({ isActive: false })
    .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)));

  return { success: true };
}

/**
 * Deletar fornecedor (hard delete)
 */
export async function deleteSupplier(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  await db
    .delete(suppliers)
    .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)));

  return { success: true };
}

import { getDb } from "../db";
import { sales, saleItems, products, customers, supplierOrders } from "../../drizzle/schema";
import { eq, and, gte, lte, inArray } from "drizzle-orm";

/**
 * Dados de relatório de vendas
 */
export interface SalesReportData {
  period: { from: Date; to: Date };
  totalSales: number;
  totalRevenue: string;
  totalProfit: string;
  averageTicket: string;
  itemsSold: number;
  paymentMethods: Record<string, { count: number; total: string }>;
  topProducts: Array<{ name: string; quantity: number; revenue: string }>;
  topCustomers: Array<{ name: string; purchases: number; total: string }>;
}

/**
 * Dados de relatório de estoque
 */
export interface StockReportData {
  products: Array<{
    name: string;
    team: string;
    sizes: Array<{ size: string; stock: number }>;
    totalStock: number;
  }>;
  totalItems: number;
  lastUpdated: Date;
}

/**
 * Gerar dados de relatório de vendas
 */
export async function generateSalesReportData(
  tenantId: number,
  from: Date,
  to: Date
): Promise<SalesReportData> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Buscar vendas no período
  const salesData = await db
    .select()
    .from(sales)
    .where(and(eq(sales.tenantId, tenantId), gte(sales.createdAt, from), lte(sales.createdAt, to)))
    .then((rows) => rows || []);

  if (salesData.length === 0) {
    return {
      period: { from, to },
      totalSales: 0,
      totalRevenue: "0.00",
      totalProfit: "0.00",
      averageTicket: "0.00",
      itemsSold: 0,
      paymentMethods: {},
      topProducts: [],
      topCustomers: [],
    };
  }

  // Calcular métricas
  const totalRevenue = salesData.reduce((acc, s) => acc + parseFloat(s.total), 0);
  const totalProfit = salesData.reduce((acc, s) => acc + parseFloat(s.profit), 0);
  const averageTicket = totalRevenue / salesData.length;

  // Agrupar por forma de pagamento
  const paymentMethods: Record<string, { count: number; total: string }> = {};
  for (const sale of salesData) {
    if (!paymentMethods[sale.paymentMethod]) {
      paymentMethods[sale.paymentMethod] = { count: 0, total: "0.00" };
    }
    paymentMethods[sale.paymentMethod].count++;
    paymentMethods[sale.paymentMethod].total = String(
      parseFloat(paymentMethods[sale.paymentMethod].total) + parseFloat(sale.total)
    );
  }

  // Buscar itens de venda para produtos mais vendidos
  const saleItemsData = await db
    .select()
    .from(saleItems)
    .where(
      inArray(
        saleItems.saleId,
        salesData.map((s) => s.id)
      )
    )
    .then((rows) => rows || []);

  // Agrupar por produto
  const productMap: Record<number, { quantity: number; revenue: number }> = {};
  for (const item of saleItemsData) {
    if (!productMap[item.productId]) {
      productMap[item.productId] = { quantity: 0, revenue: 0 };
    }
    productMap[item.productId].quantity += item.quantity;
    productMap[item.productId].revenue += parseFloat(item.unitPrice) * item.quantity;
  }

  // Buscar nomes dos produtos
  const productIds = Object.keys(productMap).map(Number);
  const productsData = await db
    .select()
    .from(products)
    .where(inArray(products.id, productIds))
    .then((rows) => rows || []);

  const productNameMap = Object.fromEntries(productsData.map((p) => [p.id, p.name]));

  const topProducts = Object.entries(productMap)
    .map(([productId, data]) => ({
      name: productNameMap[Number(productId)] || "Desconhecido",
      quantity: data.quantity,
      revenue: String(data.revenue.toFixed(2)),
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // Buscar clientes mais ativos
  const customerIds = salesData.map((s) => s.customerId);
  const customersData = await db
    .select()
    .from(customers)
    .where(inArray(customers.id, customerIds))
    .then((rows) => rows || []);

  const customerMap = Object.fromEntries(customersData.map((c) => [c.id, c.name]));

  const customerPurchases: Record<number, { count: number; total: number }> = {};
  for (const sale of salesData) {
    if (!customerPurchases[sale.customerId]) {
      customerPurchases[sale.customerId] = { count: 0, total: 0 };
    }
    customerPurchases[sale.customerId].count++;
    customerPurchases[sale.customerId].total += Number(parseFloat(sale.total));
  }

  const topCustomers = Object.entries(customerPurchases)
    .map(([customerId, data]) => ({
      name: customerMap[Number(customerId)] || "Desconhecido",
      purchases: data.count,
      total: String(Number(data.total).toFixed(2)),
    }))
    .sort((a, b) => Number(b.total) - Number(a.total))
    .slice(0, 10);

  // Contar itens vendidos
  const itemsSold = saleItemsData.reduce((acc, item) => acc + item.quantity, 0);

  return {
    period: { from, to },
    totalSales: salesData.length,
    totalRevenue: String(totalRevenue.toFixed(2)),
    totalProfit: String(totalProfit.toFixed(2)),
    averageTicket: String(averageTicket.toFixed(2)),
    itemsSold,
    paymentMethods,
    topProducts,
    topCustomers,
  };
}

/**
 * Gerar dados de relatório de estoque
 */
export async function generateStockReportData(tenantId: number): Promise<StockReportData> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Buscar produtos do tenant
  const productsData = await db
    .select()
    .from(products)
    .where(eq(products.tenantId, tenantId))
    .then((rows) => rows || []);

  if (productsData.length === 0) {
    return {
      products: [],
      totalItems: 0,
      lastUpdated: new Date(),
    };
  }

  // Buscar tamanhos de cada produto
  const { productSizes } = await import("../../drizzle/schema");
  const sizesData = await db
    .select()
    .from(productSizes)
    .where(
      inArray(
        productSizes.productId,
        productsData.map((p) => p.id)
      )
    )
    .then((rows) => rows || []);

  const sizesByProduct = Object.fromEntries(
    productsData.map((p) => [
      p.id,
      sizesData.filter((s) => s.productId === p.id),
    ])
  );

  const reportProducts = productsData.map((p) => ({
    name: p.name,
    team: p.team || "Sem time",
    sizes: (sizesByProduct[p.id] || []).map((s) => ({
      size: s.size,
      stock: s.stock,
    })),
    totalStock: (sizesByProduct[p.id] || []).reduce((acc, s) => acc + s.stock, 0),
  }));

  const totalItems = reportProducts.reduce((acc, p) => acc + p.totalStock, 0);

  return {
    products: reportProducts,
    totalItems,
    lastUpdated: new Date(),
  };
}

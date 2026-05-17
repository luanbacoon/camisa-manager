import type { Request, Response } from "express";
import { sdk } from "../_core/sdk";
import { getSupplierOrdersForTracking, updateTrackingInfo } from "../db";

export async function updateTrackingHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) {
      return res.status(403).json({ error: "cron-only" });
    }

    // Buscar pedidos com código de rastreio e status pendente/em trânsito
    const orders = await getSupplierOrdersForTracking();
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const order of orders) {
      try {
        // Validar código de rastreio
        if (!order.trackingCode || order.trackingCode.trim().length === 0) {
          skipped++;
          continue;
        }

        // Chamar API dos Correios
        const response = await fetch(
          `https://www.correios.com.br/rastreamento/api/v1/rastreamento?codigo=${encodeURIComponent(order.trackingCode)}`,
          {
            headers: {
              "Accept": "application/json",
              "User-Agent": "Mozilla/5.0",
            },
          }
        );

        if (!response.ok) {
          errors++;
          continue;
        }

        const data = await response.json();
        const newStatus = data.status || "Desconhecido";
        const lastUpdate = new Date(data.lastUpdate || new Date());
        const events = data.events || [];

        // Verificar se o status mudou (idempotência)
        // Evitar inserir histórico duplicado quando nada mudou
        if (order.trackingStatus === newStatus) {
          skipped++;
          continue;
        }

        // Atualizar no banco de dados
        await updateTrackingInfo(order.id, newStatus, lastUpdate, events);
        updated++;
      } catch (error) {
        errors++;
        console.error(`Erro ao rastrear pedido ${order.id}:`, error);
      }
    }

    res.json({
      ok: true,
      updated,
      skipped,
      errors,
      total: orders.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro no handler de rastreamento:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Erro desconhecido",
      stack: error instanceof Error ? error.stack : undefined,
      context: {
        url: req.url,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClipboardList, CheckCircle, XCircle, Eye, Phone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function fmt(v: number | string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  entregue: "Entregue",
};

const STATUS_BADGE: Record<string, string> = {
  pendente: "badge-warning",
  confirmado: "badge-info",
  cancelado: "badge-danger",
  entregue: "badge-success",
};

export default function CatalogOrders() {
  const [showDetail, setShowDetail] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: rawOrders = [], isLoading } = trpc.catalog.orders.useQuery();
  const { data: rawOrderDetail } = trpc.catalog.orderDetail.useQuery(
    { id: showDetail! },
    { enabled: !!showDetail }
  );

  type CatalogItem = { productId: number; productName: string; size: string; quantity: number; price: number };
  type OrderWithTotal = typeof rawOrders[0] & { total: number; itemCount: number; items: CatalogItem[] };

  const orders: OrderWithTotal[] = rawOrders.map((o) => {
    const items = (o.items as CatalogItem[]) ?? [];
    return {
      ...o,
      items,
      itemCount: items.reduce((acc, i) => acc + i.quantity, 0),
      total: items.reduce((acc, i) => acc + i.price * i.quantity, 0),
    };
  });

  const orderDetail = rawOrderDetail ? {
    ...rawOrderDetail,
    items: (rawOrderDetail.items as CatalogItem[]) ?? [],
    total: ((rawOrderDetail.items as CatalogItem[]) ?? []).reduce((acc, i) => acc + i.price * i.quantity, 0),
  } : null;

  const updateStatus = trpc.catalog.updateOrderStatus.useMutation({
    onSuccess: () => {
      utils.catalog.orders.invalidate();
      utils.catalog.orderDetail.invalidate({ id: showDetail! });
      toast.success("Status atualizado!");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteOrder = trpc.catalog.deleteOrder.useMutation({
    onSuccess: () => {
      utils.catalog.orders.invalidate();
      setShowDetail(null);
      setConfirmDelete(null);
      toast.success("Pedido deletado com sucesso!");
    },
    onError: (e) => toast.error(e.message),
  });

  const detailOrder = orders.find((o: OrderWithTotal) => o.id === showDetail);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Pedidos do Catálogo</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Pedidos realizados pelos clientes pelo catálogo público
        </p>
      </div>

      <div className="card-elegant">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Telefone</th>
                <th>Itens</th>
                <th>Total</th>
                <th>Status</th>
                <th>Data</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Carregando...</td></tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <ClipboardList className="w-8 h-8 text-muted-foreground/40" />
                      <p className="text-muted-foreground text-sm">Nenhum pedido do catálogo ainda</p>
                      <p className="text-xs text-muted-foreground">Compartilhe o link do catálogo com seus clientes</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-mono text-xs text-muted-foreground">#{order.id}</td>
                    <td className="text-sm font-medium">{order.customerName}</td>
                    <td>
                      <a
                        href={`https://wa.me/55${(order.customerPhone ?? "").replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-xs transition-colors"
                      >
                        <Phone className="h-3 w-3" />
                        {order.customerPhone ?? "—"}
                      </a>
                    </td>
                    <td className="text-sm">{order.itemCount} item(s)</td>
                    <td className="font-semibold">{fmt(order.total ?? 0)}</td>
                    <td>
                      <Select
                        value={order.status}
                        onValueChange={(v) => updateStatus.mutate({ id: order.id, status: v as any })}
                      >
                        <SelectTrigger className={`h-7 text-xs w-32 border-0 bg-transparent p-0 focus:ring-0 ${STATUS_BADGE[order.status]}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="confirmado">Confirmado</SelectItem>
                          <SelectItem value="entregue">Entregue</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="text-xs text-muted-foreground">
                      {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowDetail(order.id)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => setConfirmDelete(order.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja deletar o pedido #{confirmDelete}? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => confirmDelete && deleteOrder.mutate({ id: confirmDelete })}
                disabled={deleteOrder.isPending}
              >
                {deleteOrder.isPending ? "Deletando..." : "Deletar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle>Pedido do Catálogo #{showDetail}</DialogTitle>
          </DialogHeader>
          {orderDetail ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Cliente</p>
                  <p className="font-medium">{orderDetail.customerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Telefone</p>
                  <a
                    href={`https://wa.me/55${(orderDetail.customerPhone ?? "").replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <Phone className="h-3 w-3" />
                    {orderDetail.customerPhone}
                  </a>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Data</p>
                  <p className="font-medium">{format(new Date(orderDetail.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Status</p>
                  <span className={STATUS_BADGE[orderDetail.status]}>{STATUS_LABELS[orderDetail.status]}</span>
                </div>
              </div>

              {orderDetail.notes && (
                <div className="bg-muted/30 rounded-lg p-3 text-sm">
                  <p className="text-muted-foreground text-xs mb-1">Observações</p>
                  <p>{orderDetail.notes}</p>
                </div>
              )}

              <div className="card-elegant overflow-hidden">
                <table className="w-full data-table">
                  <thead>
                    <tr><th>Produto</th><th>Tam.</th><th>Qtd</th><th>Preço</th><th>Subtotal</th></tr>
                  </thead>
                  <tbody>
                    {orderDetail.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="text-sm">{item.productName}</td>
                        <td><span className="badge-neutral">{item.size}</span></td>
                        <td className="text-sm">{item.quantity}</td>
                        <td className="text-sm">{fmt(item.price)}</td>
                        <td className="font-semibold">{fmt(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between text-sm font-bold">
                <span>Total</span>
                <span className="text-primary">{fmt(orderDetail.total)}</span>
              </div>

              <div className="flex gap-2 justify-between">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setShowDetail(null);
                    setConfirmDelete(orderDetail.id);
                  }}
                  className="gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Deletar Pedido
                </Button>
                <Select
                  value={orderDetail.status}
                  onValueChange={(v) => updateStatus.mutate({ id: orderDetail.id, status: v as any })}
                >
                  <SelectTrigger className="w-40 bg-muted/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                    <SelectItem value="entregue">Entregue</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Carregando...</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

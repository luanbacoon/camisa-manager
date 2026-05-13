import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Search, Truck, CheckCircle, Package, ExternalLink, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SIZES = ["PP", "P", "M", "G", "GG", "XGG", "3G", "4G"];

function fmt(v: number | string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  em_transito: "Em Trânsito",
  recebido: "Recebido",
  cancelado: "Cancelado",
};

const STATUS_BADGE: Record<string, string> = {
  pendente: "badge-warning",
  em_transito: "badge-info",
  recebido: "badge-success",
  cancelado: "badge-danger",
};

export default function SupplierOrders() {
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showEdit, setShowEdit] = useState<number | null>(null);
  const [confirmReceive, setConfirmReceive] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: orders = [], isLoading } = trpc.supplierOrders.list.useQuery();
  const { data: products = [] } = trpc.products.list.useQuery({ activeOnly: true });

  const createOrder = trpc.supplierOrders.create.useMutation({
    onSuccess: () => { utils.supplierOrders.list.invalidate(); toast.success("Pedido registrado!"); setShowNew(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateOrder = trpc.supplierOrders.update.useMutation({
    onSuccess: () => { utils.supplierOrders.list.invalidate(); toast.success("Pedido atualizado!"); setShowEdit(null); },
    onError: (e) => toast.error(e.message),
  });
  const markReceived = trpc.supplierOrders.markReceived.useMutation({
    onSuccess: () => {
      utils.supplierOrders.list.invalidate();
      utils.stock.list.invalidate();
      utils.products.list.invalidate();
      toast.success("Pedido marcado como recebido! Estoque atualizado.");
      setConfirmReceive(null);
    },
    onError: (e) => toast.error(e.message),
  });

  // New form
  const [productId, setProductId] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [notes, setNotes] = useState("");
  const [trackingCode, setTrackingCode] = useState("");

  // Edit form
  const [editTracking, setEditTracking] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");

  function openNew() {
    setProductId(""); setSize(""); setQuantity(""); setUnitCost(""); setNotes(""); setTrackingCode("");
    setShowNew(true);
  }

  function openEdit(order: typeof orders[0]) {
    setEditTracking(order.trackingCode ?? "");
    setEditStatus(order.status);
    setEditNotes(order.notes ?? "");
    setShowEdit(order.id);
  }

  function submitNew() {
    if (!productId || !size || !quantity || !unitCost) return toast.error("Preencha todos os campos obrigatórios");
    createOrder.mutate({
      productId: Number(productId),
      size,
      quantity: Number(quantity),
      unitCost: Number(unitCost),
      notes,
      trackingCode,
    });
  }

  function submitEdit() {
    if (!showEdit) return;
    updateOrder.mutate({
      id: showEdit,
      trackingCode: editTracking,
      status: editStatus as any,
      notes: editNotes,
    });
  }

  const filtered = useMemo(
    () => orders.filter((o) =>
      (o.product?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (o.trackingCode ?? "").includes(search)
    ),
    [orders, search]
  );

  const editingOrder = orders.find((o) => o.id === showEdit);
  const confirmOrder = orders.find((o) => o.id === confirmReceive);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pedidos ao Fornecedor</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie suas compras e rastreie entregas</p>
        </div>
        <Button onClick={openNew} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Novo Pedido
        </Button>
      </div>

      <div className="card-elegant">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por produto ou rastreio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted/50 border-border"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Produto</th>
                <th>Tam.</th>
                <th>Qtd</th>
                <th>Custo Unit.</th>
                <th>Total</th>
                <th>Status</th>
                <th>Rastreio</th>
                <th>Data</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Truck className="w-8 h-8 text-muted-foreground/40" />
                      <p className="text-muted-foreground text-sm">Nenhum pedido encontrado</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id}>
                    <td className="font-mono text-xs text-muted-foreground">#{order.id}</td>
                    <td className="text-sm font-medium">{order.product?.name ?? "—"}</td>
                    <td><span className="badge-neutral">{order.size}</span></td>
                    <td className="text-sm">{order.quantity}</td>
                    <td className="text-sm">{fmt(order.unitCost)}</td>
                    <td className="font-semibold">{fmt(order.totalCost)}</td>
                    <td><span className={STATUS_BADGE[order.status]}>{STATUS_LABELS[order.status]}</span></td>
                    <td>
                      {order.trackingCode ? (
                        <a
                          href={`https://www.linkcorreios.com.br/?id=${order.trackingCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:text-primary/80 text-xs font-mono transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {order.trackingCode}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="text-xs text-muted-foreground">
                      {format(new Date(order.orderedAt), "dd/MM/yyyy", { locale: ptBR })}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(order)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        {order.status !== "recebido" && order.status !== "cancelado" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-emerald-400 hover:text-emerald-300"
                            onClick={() => setConfirmReceive(order.id)}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Order Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Novo Pedido ao Fornecedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Produto *</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger className="bg-muted/50 border-border">
                  <SelectValue placeholder="Selecionar produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} {p.team ? `(${p.team})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tamanho *</Label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger className="bg-muted/50 border-border">
                    <SelectValue placeholder="Tam." />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Quantidade *</Label>
                <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="bg-muted/50 border-border" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Custo Unitário (R$) *</Label>
              <Input type="number" step="0.01" min="0" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} className="bg-muted/50 border-border" placeholder="0,00" />
            </div>
            {quantity && unitCost && (
              <div className="bg-muted/30 rounded-lg p-3 text-sm">
                <p className="text-muted-foreground">Total do pedido: <span className="text-foreground font-semibold">{fmt(Number(quantity) * Number(unitCost))}</span></p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Código de Rastreio (Correios)</Label>
              <Input value={trackingCode} onChange={(e) => setTrackingCode(e.target.value.toUpperCase())} className="bg-muted/50 border-border font-mono" placeholder="AA000000000BR" />
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-muted/50 border-border resize-none" rows={2} />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
              <Button onClick={submitNew} disabled={createOrder.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {createOrder.isPending ? "Registrando..." : "Registrar Pedido"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Editar Pedido #{showEdit}</DialogTitle>
          </DialogHeader>
          {editingOrder && (
            <div className="space-y-4 pt-2">
              <div className="bg-muted/30 rounded-lg p-3 text-sm">
                <p className="font-medium">{editingOrder.product?.name}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{editingOrder.size} • {editingOrder.quantity} unidades</p>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="bg-muted/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_transito">Em Trânsito</SelectItem>
                    <SelectItem value="recebido">Recebido</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Código de Rastreio</Label>
                <Input value={editTracking} onChange={(e) => setEditTracking(e.target.value.toUpperCase())} className="bg-muted/50 border-border font-mono" placeholder="AA000000000BR" />
                {editTracking && (
                  <a
                    href={`https://www.linkcorreios.com.br/?id=${editTracking}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary text-xs mt-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Rastrear nos Correios
                  </a>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Observações</Label>
                <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="bg-muted/50 border-border resize-none" rows={2} />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowEdit(null)}>Cancelar</Button>
                <Button onClick={submitEdit} disabled={updateOrder.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Receive Dialog */}
      <Dialog open={!!confirmReceive} onOpenChange={() => setConfirmReceive(null)}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              Confirmar Recebimento
            </DialogTitle>
          </DialogHeader>
          {confirmOrder && (
            <div className="space-y-4 pt-2">
              <div className="bg-muted/30 rounded-lg p-3 text-sm">
                <p className="font-medium">{confirmOrder.product?.name}</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {confirmOrder.size} • {confirmOrder.quantity} unidades • {fmt(confirmOrder.totalCost)}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Ao confirmar, o estoque será atualizado automaticamente com <strong className="text-foreground">{confirmOrder.quantity} unidades</strong> no tamanho <strong className="text-foreground">{confirmOrder.size}</strong>.
              </p>
              <p className="text-xs text-muted-foreground">
                O custo médio do produto também será recalculado.
              </p>
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={() => setConfirmReceive(null)}>Cancelar</Button>
                <Button
                  onClick={() => markReceived.mutate({ id: confirmReceive! })}
                  disabled={markReceived.isPending}
                  className="bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  {markReceived.isPending ? "Confirmando..." : "Confirmar Recebimento"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

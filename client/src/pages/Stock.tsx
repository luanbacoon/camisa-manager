import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Boxes, Edit2, History, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Stock() {
  const [search, setSearch] = useState("");
  const [showAdjust, setShowAdjust] = useState<{ productId: number; size: string; current: number; productName: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [newQty, setNewQty] = useState("");
  const [reason, setReason] = useState("");

  const utils = trpc.useUtils();
  const { data: stock = [], isLoading } = trpc.stock.list.useQuery();
  const { data: history = [] } = trpc.stock.history.useQuery();

  const adjust = trpc.stock.adjust.useMutation({
    onSuccess: () => {
      utils.stock.list.invalidate();
      utils.stock.history.invalidate();
      toast.success("Estoque ajustado com sucesso!");
      setShowAdjust(null);
    },
    onError: (e) => toast.error(e.message),
  });

  function openAdjust(item: typeof stock[0]) {
    setShowAdjust({
      productId: item.productId,
      size: item.size,
      current: item.stock,
      productName: item.product.name,
    });
    setNewQty(String(item.stock));
    setReason("");
  }

  function submitAdjust() {
    if (!showAdjust) return;
    if (!reason.trim() || reason.trim().length < 5) return toast.error("Justificativa deve ter pelo menos 5 caracteres");
    if (newQty === "") return toast.error("Informe a nova quantidade");
    adjust.mutate({
      productId: showAdjust.productId,
      size: showAdjust.size,
      newQuantity: Number(newQty),
      reason,
    });
  }

  // Group by product
  const grouped = useMemo(() => {
    const map: Record<number, { product: typeof stock[0]["product"]; sizes: typeof stock }> = {};
    for (const item of stock) {
      if (!map[item.productId]) {
        map[item.productId] = { product: item.product, sizes: [] };
      }
      map[item.productId].sizes.push(item);
    }
    return Object.values(map).filter((g) =>
      g.product.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.product.team ?? "").toLowerCase().includes(search.toLowerCase())
    );
  }, [stock, search]);

  const typeLabels: Record<string, string> = {
    venda: "Venda",
    pedido_recebido: "Pedido Recebido",
    ajuste_manual: "Ajuste Manual",
    devolucao: "Devolução",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Estoque</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visualize e gerencie o estoque em tempo real</p>
        </div>
        <Button variant="outline" onClick={() => setShowHistory(true)} className="gap-2 border-border">
          <History className="h-4 w-4" />
          Histórico de Movimentações
        </Button>
      </div>

      <div className="card-elegant">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por produto ou time..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted/50 border-border"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Carregando estoque...</div>
        ) : grouped.length === 0 ? (
          <div className="p-12 text-center">
            <Boxes className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Nenhum produto em estoque</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {grouped.map(({ product, sizes }) => {
              const totalStock = sizes.reduce((acc, s) => acc + s.stock, 0);
              const hasLowStock = sizes.some((s) => s.stock <= 2);
              return (
                <div key={product.id} className="p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover border border-border" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Boxes className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{product.name}</p>
                          {hasLowStock && (
                            <div className="flex items-center gap-1 text-amber-400">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span className="text-xs">Estoque baixo</span>
                            </div>
                          )}
                        </div>
                        {product.team && <p className="text-xs text-muted-foreground">{product.team}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-lg font-bold text-foreground">{totalStock}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sizes.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          item.stock === 0
                            ? "bg-destructive/10 border-destructive/30 text-destructive"
                            : item.stock <= 2
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        }`}
                      >
                        <span className="text-muted-foreground">{item.size}:</span>
                        <span className="font-bold">{item.stock}</span>
                        <button
                          onClick={() => openAdjust(item)}
                          className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Adjust Dialog */}
      <Dialog open={!!showAdjust} onOpenChange={() => setShowAdjust(null)}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle>Ajuste Manual de Estoque</DialogTitle>
          </DialogHeader>
          {showAdjust && (
            <div className="space-y-4 pt-2">
              <div className="bg-muted/30 rounded-lg p-3 text-sm">
                <p className="font-medium">{showAdjust.productName}</p>
                <p className="text-muted-foreground text-xs mt-0.5">Tamanho: {showAdjust.size} • Atual: {showAdjust.current} unidades</p>
              </div>
              <div className="space-y-1.5">
                <Label>Nova Quantidade *</Label>
                <Input
                  type="number"
                  min="0"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  className="bg-muted/50 border-border"
                />
                {newQty !== "" && (
                  <p className="text-xs text-muted-foreground">
                    Variação: {Number(newQty) - showAdjust.current > 0 ? "+" : ""}{Number(newQty) - showAdjust.current} unidades
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Justificativa *</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="bg-muted/50 border-border resize-none"
                  rows={3}
                  placeholder="Descreva o motivo do ajuste (mín. 5 caracteres)"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowAdjust(null)}>Cancelar</Button>
                <Button
                  onClick={submitAdjust}
                  disabled={adjust.isPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {adjust.isPending ? "Ajustando..." : "Confirmar Ajuste"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl bg-card border-border max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Movimentações</DialogTitle>
          </DialogHeader>
          <div className="card-elegant overflow-hidden">
            <table className="w-full data-table">
              <thead>
                <tr><th>Data</th><th>Produto</th><th>Tam.</th><th>Tipo</th><th>Antes</th><th>Depois</th><th>Variação</th></tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">Nenhuma movimentação</td></tr>
                ) : (
                  history.map((h) => (
                    <tr key={h.id}>
                      <td className="text-xs text-muted-foreground">{format(new Date(h.createdAt), "dd/MM HH:mm", { locale: ptBR })}</td>
                      <td className="text-sm">Prod. #{h.productId}</td>
                      <td><span className="badge-neutral">{h.size}</span></td>
                      <td>
                        <span className={h.type === "venda" ? "badge-info" : h.type === "ajuste_manual" ? "badge-warning" : "badge-success"}>
                          {typeLabels[h.type] ?? h.type}
                        </span>
                      </td>
                      <td className="text-sm">{h.quantityBefore}</td>
                      <td className="text-sm">{h.quantityAfter}</td>
                      <td className={`text-sm font-semibold ${h.delta >= 0 ? "text-emerald-400" : "text-destructive"}`}>
                        {h.delta >= 0 ? "+" : ""}{h.delta}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

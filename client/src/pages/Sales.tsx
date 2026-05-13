import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Search, ShoppingCart, X, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const SIZES = ["PP", "P", "M", "G", "GG", "XGG", "3G", "4G"];
const PAYMENT_METHODS = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "cartao_debito", label: "Cartão de Débito" },
  { value: "transferencia", label: "Transferência" },
  { value: "outro", label: "Outro" },
];

function fmt(value: number | string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

type CartItem = {
  productId: number;
  productName: string;
  size: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
};

export default function Sales() {
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showDetail, setShowDetail] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: sales = [], isLoading } = trpc.sales.list.useQuery();
  const { data: customers = [] } = trpc.customers.list.useQuery();
  const { data: products = [] } = trpc.products.list.useQuery({ activeOnly: true });
  const { data: saleDetail } = trpc.sales.get.useQuery({ id: showDetail! }, { enabled: !!showDetail });

  const createSale = trpc.sales.create.useMutation({
    onSuccess: () => {
      utils.sales.list.invalidate();
      utils.stock.list.invalidate();
      toast.success("Venda registrada com sucesso!");
      setShowNew(false);
    },
    onError: (e) => toast.error(e.message),
  });

  // Form state
  const [customerId, setCustomerId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selProduct, setSelProduct] = useState<string>("");
  const [selSize, setSelSize] = useState<string>("");
  const [selQty, setSelQty] = useState(1);

  const defaultCustomer = useMemo(() => customers.find((c) => c.isDefault), [customers]);

  function openNew() {
    setCustomerId(defaultCustomer ? String(defaultCustomer.id) : "");
    setPaymentMethod("");
    setNotes("");
    setCart([]);
    setSelProduct("");
    setSelSize("");
    setSelQty(1);
    setShowNew(true);
  }

  function addToCart() {
    if (!selProduct || !selSize) return toast.error("Selecione produto e tamanho");
    const product = products.find((p) => p.id === Number(selProduct));
    if (!product) return;
    const existing = cart.findIndex(
      (i) => i.productId === product.id && i.size === selSize
    );
    if (existing >= 0) {
      const updated = [...cart];
      updated[existing].quantity += selQty;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          productName: product.name,
          size: selSize,
          quantity: selQty,
          unitPrice: Number(product.price),
          unitCost: Number(product.avgCost),
        },
      ]);
    }
    setSelProduct("");
    setSelSize("");
    setSelQty(1);
  }

  function removeFromCart(idx: number) {
    setCart(cart.filter((_, i) => i !== idx));
  }

  const cartTotal = cart.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);

  function submitSale() {
    if (!customerId) return toast.error("Selecione um cliente");
    if (!paymentMethod) return toast.error("Selecione a forma de pagamento");
    if (cart.length === 0) return toast.error("Adicione pelo menos um produto");
    createSale.mutate({
      customerId: Number(customerId),
      paymentMethod: paymentMethod as any,
      notes,
      items: cart,
    });
  }

  const filtered = useMemo(
    () =>
      sales.filter((s) => {
        const id = String(s.id).includes(search);
        return id || search === "";
      }),
    [sales, search]
  );

  const paymentLabel = (method: string) =>
    PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Vendas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Registre e acompanhe todas as vendas</p>
        </div>
        <Button onClick={openNew} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Nova Venda
        </Button>
      </div>

      <div className="card-elegant">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID..."
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
                <th>Data</th>
                <th>Cliente</th>
                <th>Pagamento</th>
                <th>Total</th>
                <th>Lucro</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <ShoppingCart className="w-8 h-8 text-muted-foreground/40" />
                      <p className="text-muted-foreground text-sm">Nenhuma venda encontrada</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((sale) => (
                  <tr key={sale.id} className="cursor-pointer" onClick={() => setShowDetail(sale.id)}>
                    <td className="font-mono text-xs text-muted-foreground">#{sale.id}</td>
                    <td className="text-sm">
                      {format(new Date(sale.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </td>
                    <td className="text-sm">—</td>
                    <td><span className="badge-info">{paymentLabel(sale.paymentMethod)}</span></td>
                    <td className="font-semibold text-foreground">{fmt(sale.total)}</td>
                    <td className="text-emerald-400 font-medium">{fmt(sale.profit)}</td>
                    <td>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Sale Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Nova Venda</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Cliente</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger className="bg-muted/50 border-border">
                    <SelectValue placeholder="Selecionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} {c.isDefault ? "(padrão)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Forma de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="bg-muted/50 border-border">
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Add product */}
            <div className="card-elegant p-4 space-y-3">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Adicionar Produto</p>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-5">
                  <Select value={selProduct} onValueChange={setSelProduct}>
                    <SelectTrigger className="bg-muted/50 border-border">
                      <SelectValue placeholder="Produto" />
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
                <div className="col-span-3">
                  <Select value={selSize} onValueChange={setSelSize}>
                    <SelectTrigger className="bg-muted/50 border-border">
                      <SelectValue placeholder="Tam." />
                    </SelectTrigger>
                    <SelectContent>
                      {SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    min={1}
                    value={selQty}
                    onChange={(e) => setSelQty(Number(e.target.value))}
                    className="bg-muted/50 border-border"
                    placeholder="Qtd"
                  />
                </div>
                <div className="col-span-2">
                  <Button onClick={addToCart} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Cart */}
            {cart.length > 0 && (
              <div className="card-elegant overflow-hidden">
                <table className="w-full data-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Tam.</th>
                      <th>Qtd</th>
                      <th>Preço</th>
                      <th>Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, idx) => (
                      <tr key={idx}>
                        <td className="text-sm font-medium">{item.productName}</td>
                        <td><span className="badge-neutral">{item.size}</span></td>
                        <td className="text-sm">{item.quantity}</td>
                        <td className="text-sm">{fmt(item.unitPrice)}</td>
                        <td className="font-semibold">{fmt(item.unitPrice * item.quantity)}</td>
                        <td>
                          <button onClick={() => removeFromCart(idx)} className="text-destructive hover:text-destructive/80 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-4 border-t border-border flex justify-end">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-xl font-bold text-primary">{fmt(cartTotal)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Observações (opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-muted/50 border-border resize-none"
                rows={2}
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
              <Button
                onClick={submitSale}
                disabled={createSale.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                {createSale.isPending ? "Registrando..." : `Confirmar Venda ${cart.length > 0 ? `• ${fmt(cartTotal)}` : ""}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda #{showDetail}</DialogTitle>
          </DialogHeader>
          {saleDetail ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Cliente</p>
                  <p className="font-medium">{saleDetail.customer?.name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Pagamento</p>
                  <p className="font-medium">{paymentLabel(saleDetail.paymentMethod)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Data</p>
                  <p className="font-medium">{format(new Date(saleDetail.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Total</p>
                  <p className="font-bold text-primary">{fmt(saleDetail.total)}</p>
                </div>
              </div>
              <div className="card-elegant overflow-hidden">
                <table className="w-full data-table">
                  <thead>
                    <tr><th>Produto</th><th>Tam.</th><th>Qtd</th><th>Preço</th></tr>
                  </thead>
                  <tbody>
                    {saleDetail.items.map((item) => (
                      <tr key={item.id}>
                        <td className="text-sm">{item.product?.name ?? "—"}</td>
                        <td><span className="badge-neutral">{item.size}</span></td>
                        <td className="text-sm">{item.quantity}</td>
                        <td className="text-sm">{fmt(item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Lucro</span>
                <span className="text-emerald-400 font-semibold">{fmt(saleDetail.profit)}</span>
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

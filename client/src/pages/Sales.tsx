import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Search, ShoppingCart, X, Trash2, Eye, Edit2, TrendingUp, Shirt } from "lucide-react";
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

type PeriodType = "hoje" | "semana" | "mes" | "personalizado";

export default function Sales() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [periodType, setPeriodType] = useState<PeriodType>("mes");
  const [showNew, setShowNew] = useState(false);
  const [showDetail, setShowDetail] = useState<number | null>(null);

  // Modal state
  const [productSearch, setProductSearch] = useState("");
  const [saleDate, setSaleDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [customerId, setCustomerId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [discountValue, setDiscountValue] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selProduct, setSelProduct] = useState<string>("");
  const [selSize, setSelSize] = useState<string>("");
  const [selQty, setSelQty] = useState(1);

  const utils = trpc.useUtils();
  const { data: sales = [], isLoading } = trpc.sales.list.useQuery({});
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

  const defaultCustomer = useMemo(() => customers.find((c) => c.isDefault), [customers]);

  // Calculate period dates
  const now = new Date();
  const periodStart = useMemo(() => {
    switch (periodType) {
      case "hoje":
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case "semana":
        return subDays(now, 7);
      case "mes":
        return startOfMonth(now);
      default:
        return subDays(now, 30);
    }
  }, [periodType]);

  // Filter and calculate metrics
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const saleDate = new Date(s.createdAt);
      const matchPeriod = saleDate >= periodStart && saleDate <= now;
      return matchPeriod;
    });
  }, [sales, periodStart, search]);

  const metrics = useMemo(() => {
    const totalSales = filteredSales.length;
    const totalItems = 0;
    const totalRevenue = filteredSales.reduce((acc, s) => acc + Number(s.total), 0);
    const totalProfit = filteredSales.reduce((acc, s) => acc + Number(s.profit), 0);
    const totalCost = totalRevenue - totalProfit;
    const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    const estimatedProfit = 0;

    return { totalSales, totalItems, totalRevenue, totalProfit, avgTicket, estimatedProfit };
  }, [filteredSales, products]);

  // Filter products for modal
  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.team ?? "").toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  function openNew() {
    setCustomerId(defaultCustomer ? String(defaultCustomer.id) : "");
    setPaymentMethod("");
    setNotes("");
    setCart([]);
    setSelProduct("");
    setSelSize("");
    setSelQty(1);
    setProductSearch("");
    setSaleDate(format(new Date(), "yyyy-MM-dd"));
    setDiscountValue(0);
    setDiscountPercent(0);
    setShowNew(true);
  }

  function addToCart() {
    if (!selProduct || !selSize) return toast.error("Selecione produto e tamanho");
    const product = products.find((p) => p.id === Number(selProduct));
    if (!product) return;
    const existing = cart.findIndex((i) => i.productId === product.id && i.size === selSize);
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
    toast.success("Produto adicionado ao carrinho!");
  }

  function removeFromCart(idx: number) {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }

  const cartSubtotal = cart.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const cartDiscount = discountValue > 0 ? discountValue : (cartSubtotal * discountPercent) / 100;
  const cartTotal = Math.max(0, cartSubtotal - cartDiscount);

  function confirmSale() {
    if (!customerId) return toast.error("Selecione um cliente");
    if (!paymentMethod) return toast.error("Selecione a forma de pagamento");
    if (cart.length === 0) return toast.error("Adicione produtos ao carrinho");

    createSale.mutate({
      customerId: Number(customerId),
      paymentMethod: paymentMethod as any,
      saleDate: new Date(saleDate),
      discountValue: discountValue > 0 ? discountValue : undefined,
      discountPercent: discountPercent > 0 ? discountPercent : undefined,
      items: cart,
      notes,
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vendas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Registro e histórico de vendas</p>
        </div>
        <Button onClick={openNew} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Nova Venda
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="metric-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Qtd de Vendas</p>
          <p className="text-2xl font-bold mt-2">{metrics.totalSales}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Peças Vendidas</p>
          <p className="text-2xl font-bold mt-2">{metrics.totalItems}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Valor Vendido</p>
          <p className="text-2xl font-bold text-primary mt-2">{fmt(metrics.totalRevenue)}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Ticket Médio</p>
          <p className="text-2xl font-bold mt-2">{fmt(metrics.avgTicket)}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Lucro Realizado</p>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{fmt(metrics.totalProfit)}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Lucro Estimado</p>
          <p className="text-xs text-muted-foreground mt-1">Estoque em mãos</p>
          <p className="text-xl font-bold text-amber-400 mt-1">{fmt(metrics.estimatedProfit)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <Select value={periodType} onValueChange={(v) => setPeriodType(v as PeriodType)}>
          <SelectTrigger className="w-40 bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hoje">Hoje</SelectItem>
            <SelectItem value="semana">Última Semana</SelectItem>
            <SelectItem value="mes">Este Mês</SelectItem>
            <SelectItem value="personalizado">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sales Table */}
      <div className="card-elegant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente</th>
                <th>Forma Pgto</th>
                <th>Total</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">Nenhuma venda neste período</p>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="text-sm">{format(new Date(sale.createdAt), "dd/MM/yyyy", { locale: ptBR })}</td>
                    <td className="text-sm font-medium">—</td>
                    <td className="text-xs">
                      <span className="badge-neutral">{PAYMENT_METHODS.find((m) => m.value === sale.paymentMethod)?.label ?? sale.paymentMethod}</span>
                    </td>
                    <td className="font-semibold">{fmt(sale.total)}</td>
                    <td>
                      <span className="badge-success">Finalizado</span>
                    </td>
                    <td className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setShowDetail(sale.id)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
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
        <DialogContent className="max-w-6xl bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Venda</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
            {/* Left: Products Grid */}
            <div className="lg:col-span-2 space-y-4">
              {/* Search and Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produto..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9 bg-muted/50 border-border"
                  />
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    <Shirt className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhum produto encontrado</p>
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="card-elegant p-3 cursor-pointer hover:border-primary/50 transition-all group"
                    >
                      {/* Product Image */}
                      <div className="aspect-square bg-muted/30 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <Shirt className="h-8 w-8 text-muted-foreground/30" />
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="space-y-1.5">
                        {product.team && (
                          <p className="text-[10px] text-primary font-medium uppercase tracking-wider">{product.team}</p>
                        )}
                        <h4 className="text-xs font-semibold line-clamp-2">{product.name}</h4>
                        <p className="text-sm font-bold text-primary">{fmt(product.price)}</p>

                        {/* Size Selector */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-muted-foreground">Tamanho</label>
                          <Select value={selProduct === String(product.id) ? selSize : ""} onValueChange={(size) => {
                            setSelProduct(String(product.id));
                            setSelSize(size);
                          }}>
                            <SelectTrigger className="h-7 text-xs bg-muted/50 border-border">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {SIZES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Add Button */}
                        <Button
                          onClick={() => {
                            if (selProduct === String(product.id) && selSize) {
                              addToCart();
                            }
                          }}
                          disabled={selProduct !== String(product.id) || !selSize}
                          className="w-full h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="space-y-4">
              {/* Customer */}
              <div className="space-y-1.5">
                <Label className="text-xs">Cliente *</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger className="bg-muted/50 border-border h-9 text-sm">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <Label className="text-xs">Data da Venda *</Label>
                <Input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="bg-muted/50 border-border h-9 text-sm"
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <Label className="text-xs">Forma de Pagamento *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="bg-muted/50 border-border h-9 text-sm">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Discounts */}
              <div className="space-y-2 p-3 bg-muted/20 rounded-lg">
                <p className="text-xs font-semibold">Desconto</p>
                <div className="space-y-1.5">
                  <Label className="text-[10px]">Valor (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountValue}
                    onChange={(e) => {
                      setDiscountValue(Number(e.target.value));
                      setDiscountPercent(0);
                    }}
                    className="bg-muted/50 border-border h-8 text-xs"
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px]">Percentual (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={discountPercent}
                    onChange={(e) => {
                      setDiscountPercent(Number(e.target.value));
                      setDiscountValue(0);
                    }}
                    className="bg-muted/50 border-border h-8 text-xs"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Cart */}
              <div className="space-y-2 p-3 bg-muted/20 rounded-lg max-h-[300px] overflow-y-auto">
                <p className="text-xs font-semibold">Carrinho ({cart.length})</p>
                {cart.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Carrinho vazio</p>
                ) : (
                  <div className="space-y-1.5">
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
                        <div className="flex-1">
                          <p className="font-medium line-clamp-1">{item.productName}</p>
                          <p className="text-muted-foreground">{item.size} × {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold whitespace-nowrap">{fmt(item.unitPrice * item.quantity)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                            onClick={() => removeFromCart(idx)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-2 p-3 bg-muted/20 rounded-lg">
                <div className="flex justify-between text-xs">
                  <span>Subtotal</span>
                  <span className="font-medium">{fmt(cartSubtotal)}</span>
                </div>
                {cartDiscount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-400">
                    <span>Desconto</span>
                    <span className="font-medium">-{fmt(cartDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">{fmt(cartTotal)}</span>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs">Observações</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-muted/50 border-border resize-none text-xs"
                  rows={2}
                  placeholder="Adicione observações..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowNew(false)} className="flex-1 h-9 text-sm">
                  Cancelar
                </Button>
                <Button
                  onClick={confirmSale}
                  disabled={createSale.isPending || cart.length === 0}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-sm gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {createSale.isPending ? "Registrando..." : "Registrar"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      {saleDetail && (
        <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
          <DialogContent className="max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle>Detalhes da Venda</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground text-xs">Data</p>
                  <p className="font-medium">{format(new Date(saleDetail.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Forma de Pagamento</p>
                  <p className="font-medium">{PAYMENT_METHODS.find((m) => m.value === saleDetail.paymentMethod)?.label}</p>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-2">Produtos</p>
                {(saleDetail.items as any[])?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-1">
                    <span>{item.productName} ({item.size}) × {item.quantity}</span>
                    <span className="font-medium">{fmt(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-sm font-bold">
                <span>Total</span>
                <span className="text-primary">{fmt(saleDetail.total)}</span>
              </div>

              {saleDetail.notes && (
                <div className="bg-muted/30 rounded-lg p-3 text-xs">
                  <p className="text-muted-foreground mb-1">Observações</p>
                  <p>{saleDetail.notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

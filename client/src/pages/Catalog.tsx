import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Search, Package, ShoppingBag, X, Plus, Minus, Send, Shirt, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const SIZES = ["PP", "P", "M", "G", "GG", "XGG", "3G", "4G"];

function fmt(v: number | string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}

type CartItem = {
  productId: number;
  productName: string;
  size: string;
  quantity: number;
  unitPrice: number;
};

export default function Catalog() {
  const [search, setSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("Todos");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  const { data: products = [], isLoading } = trpc.catalog.products.useQuery();
  const { data: settings } = trpc.catalog.settings.useQuery();

  const submitOrder = trpc.catalog.submitOrder.useMutation({
    onSuccess: () => {
      toast.success("Pedido enviado com sucesso! Entraremos em contato em breve.");
      setCart([]);
      setShowOrder(false);
      setShowCart(false);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerNotes("");
    },
    onError: (e) => toast.error(e.message),
  });

  const teams = useMemo(() => {
    const all = new Set(products.map((p) => p.team).filter(Boolean) as string[]);
    return ["Todos", ...Array.from(all).sort()];
  }, [products]);

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const matchSearch =
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.team ?? "").toLowerCase().includes(search.toLowerCase());
        const matchTeam = selectedTeam === "Todos" || p.team === selectedTeam;
        return matchSearch && matchTeam;
      }),
    [products, search, selectedTeam]
  );

  function addToCart(productId: number, productName: string, size: string, price: number) {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.productId === productId && i.size === size);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      }
      return [...prev, { productId, productName, size, quantity: 1, unitPrice: price }];
    });
    toast.success(`${productName} (${size}) adicionado ao pedido!`);
  }

  function updateQty(idx: number, delta: number) {
    setCart((prev) => {
      const updated = [...prev];
      updated[idx].quantity = Math.max(1, updated[idx].quantity + delta);
      return updated;
    });
  }

  function removeFromCart(idx: number) {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }

  const cartTotal = cart.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const cartCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  function sendOrder() {
    if (!customerName.trim()) return toast.error("Informe seu nome");
    if (!customerPhone.trim()) return toast.error("Informe seu telefone");
    if (cart.length === 0) return toast.error("Adicione produtos ao pedido");
    submitOrder.mutate({
      customerName,
      customerPhone,
      notes: customerNotes,
      items: cart,
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Shirt className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-gold-gradient leading-none">
                {settings?.storeName ?? "CamisaManager"}
              </p>
              <p className="text-[10px] text-muted-foreground">Catálogo Oficial</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {settings?.instagram && (
              <a
                href={`https://instagram.com/${settings.instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
            )}
            <Button
              onClick={() => setShowCart(true)}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 relative"
              size="sm"
            >
              <ShoppingBag className="h-4 w-4" />
              Meu Pedido
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-10 text-center">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-gold-gradient">{settings?.storeName ?? "Catálogo"}</span>
          </h1>
          <p className="text-muted-foreground">
            Escolha seus produtos e faça seu pedido diretamente por aqui
          </p>
          {settings?.whatsapp && (
            <a
              href={`https://wa.me/55${settings.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <span>💬</span>
              Falar no WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {teams.map((team) => (
              <button
                key={team}
                onClick={() => setSelectedTeam(team)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                  selectedTeam === team
                    ? "bg-primary/15 border-primary text-primary"
                    : "bg-card border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {team}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">Carregando catálogo...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((product) => (
              <div key={product.id} className="card-elegant overflow-hidden group hover:border-primary/30 transition-all">
                {/* Product image */}
                <div className="aspect-square bg-muted/30 flex items-center justify-center overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
                      <Shirt className="w-12 h-12" />
                      <span className="text-xs">Sem foto</span>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    {product.team && (
                      <p className="text-[10px] text-primary font-medium uppercase tracking-wider mb-0.5">{product.team}</p>
                    )}
                    <h3 className="text-sm font-semibold leading-snug">{product.name}</h3>
                    {product.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                    )}
                  </div>

                  <p className="text-lg font-bold text-primary">{fmt(product.price)}</p>

                  {/* Sizes */}
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1.5">Tamanhos disponíveis:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {product.sizes
                        .filter((s) => s.stock > 0)
                        .map((s) => (
                          <button
                            key={s.size}
                            onClick={() => addToCart(product.id, product.name, s.size, Number(product.price))}
                            className="px-2.5 py-1 rounded-md text-xs font-medium border border-border bg-muted/50 hover:bg-primary/10 hover:border-primary hover:text-primary transition-all active:scale-95"
                          >
                            {s.size}
                          </button>
                        ))}
                      {product.sizes.filter((s) => s.stock > 0).length === 0 && (
                        <span className="text-xs text-muted-foreground">Sem estoque</span>
                      )}
                    </div>
                  </div>

                  {product.sizes.some((s) => s.stock === 0) && product.sizes.some((s) => s.stock > 0) && (
                    <p className="text-[10px] text-muted-foreground">
                      Alguns tamanhos sem estoque. Clique no tamanho desejado para adicionar.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-lg bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Meu Pedido
            </DialogTitle>
          </DialogHeader>

          {cart.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Nenhum produto adicionado</p>
              <Button variant="outline" onClick={() => setShowCart(false)} className="mt-4">
                Continuar Navegando
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">Tamanho: {item.size} • {fmt(item.unitPrice)} cada</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(idx, -1)} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(idx, 1)} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm font-semibold w-20 text-right">{fmt(item.unitPrice * item.quantity)}</p>
                    <button onClick={() => removeFromCart(idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center py-3 border-t border-border">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-primary">{fmt(cartTotal)}</span>
              </div>

              <Button
                onClick={() => { setShowCart(false); setShowOrder(true); }}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                <Send className="h-4 w-4" />
                Finalizar Pedido
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Order Form Dialog */}
      <Dialog open={showOrder} onOpenChange={setShowOrder}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Finalizar Pedido</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Seu Nome *</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="bg-muted/50 border-border" placeholder="Nome completo" />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone / WhatsApp *</Label>
              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="bg-muted/50 border-border" placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} className="bg-muted/50 border-border resize-none" rows={2} placeholder="Endereço de entrega, preferências..." />
            </div>

            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-2">Resumo do pedido ({cart.length} item{cart.length !== 1 ? "s" : ""})</p>
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs py-0.5">
                  <span>{item.productName} ({item.size}) × {item.quantity}</span>
                  <span className="font-medium">{fmt(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary">{fmt(cartTotal)}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => { setShowOrder(false); setShowCart(true); }}>Voltar</Button>
              <Button
                onClick={sendOrder}
                disabled={submitOrder.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                <Send className="h-4 w-4" />
                {submitOrder.isPending ? "Enviando..." : "Enviar Pedido"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            {settings?.storeName ?? "CamisaManager"} • Sistema de Gestão de Loja
          </p>
        </div>
      </footer>
    </div>
  );
}

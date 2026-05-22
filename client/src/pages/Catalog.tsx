import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/SimpleToast";
import { Search, Package, ShoppingBag, X, Plus, Minus, Send, Shirt, Instagram, MessageCircle } from "lucide-react";
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
  const [showGallery, setShowGallery] = useState<number | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

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

  function removeFromCart(productId: number, size: string) {
    setCart((prev) => prev.filter((i) => !(i.productId === productId && i.size === size)));
  }

  function updateQuantity(productId: number, size: string, qty: number) {
    if (qty <= 0) {
      removeFromCart(productId, size);
    } else {
      setCart((prev) =>
        prev.map((i) => (i.productId === productId && i.size === size ? { ...i, quantity: qty } : i))
      );
    }
  }

  const total = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  function handleSubmitOrder() {
    if (!customerName.trim()) {
      toast.error("Por favor, informe seu nome");
      return;
    }
    if (!customerPhone.trim()) {
      toast.error("Por favor, informe seu telefone");
      return;
    }
    if (cart.length === 0) {
      toast.error("Seu pedido está vazio");
      return;
    }

    submitOrder.mutate({
      customerName,
      customerPhone,
      items: cart,
      notes: customerNotes,
    });
  }

  function sendViaWhatsApp() {
    if (cart.length === 0) {
      toast.error("Seu pedido está vazio");
      return;
    }

    const itemsText = cart
      .map((item) => `${item.quantity}x ${item.productName} (${item.size}) - R$ ${fmt(item.unitPrice)}`)
      .join("\n");

    const message = `Olá! Gostaria de fazer um pedido:\n\n${itemsText}\n\nTotal: ${fmt(total)}\n\nObrigado!`;
    const encoded = encodeURIComponent(message);
    const whatsappNumber = settings?.whatsapp?.replace(/\D/g, "") || "";

    if (whatsappNumber) {
      window.open(`https://wa.me/55${whatsappNumber}?text=${encoded}`, "_blank");
    } else {
      toast.error("WhatsApp não configurado");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Banner */}
      {settings?.bannerUrl && (
        <div className="w-full h-40 overflow-hidden">
          <img src={settings.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {settings?.logoUrl && (
                <img src={settings.logoUrl} alt="Logo" className="h-12 w-12 rounded-lg object-cover" />
              )}
              <div>
                <h1 className="text-2xl font-bold">{settings?.storeName || "Catálogo"}</h1>
                <p className="text-sm text-muted-foreground">Escolha seus produtos e faça seu pedido</p>
              </div>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="relative px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors"
            >
              <ShoppingBag className="h-5 w-5 text-primary" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                  {cart.length}
                </span>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto ou time..."
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
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
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
                {/* Product image with gallery */}
                <div className="aspect-square bg-muted/30 flex items-center justify-center overflow-hidden relative group/image">
                  {product.gallery && product.gallery.length > 0 ? (
                    <>
                      <img
                        src={product.gallery[0]?.imageUrl || product.imageUrl || ""}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                        onClick={() => { setShowGallery(product.id); setGalleryIndex(0); }}
                      />
                      {product.gallery.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover/image:opacity-100 transition-opacity">
                          {product.gallery.length} fotos
                        </div>
                      )}
                    </>
                  ) : product.imageUrl ? (
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

                  {/* Sizes - All available for ordering */}
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1.5">Tamanhos (clique para encomendar):</p>
                    <div className="flex flex-wrap gap-1.5">
                      {product.sizes.map((s) => (
                        <button
                          key={s.size}
                          onClick={() => addToCart(product.id, product.name, s.size, Number(product.price))}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all active:scale-95 ${
                            s.stock > 0
                              ? "border-border bg-muted/50 hover:bg-primary/10 hover:border-primary hover:text-primary"
                              : "border-dashed border-muted-foreground/30 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:border-muted-foreground/50"
                          }`}
                          title={s.stock > 0 ? "Em estoque" : "Sob encomenda"}
                        >
                          {s.size}
                          {s.stock === 0 && <span className="text-[8px] ml-1">*</span>}
                        </button>
                      ))}
                    </div>
                    {product.sizes.some((s) => s.stock === 0) && (
                      <p className="text-[9px] text-muted-foreground mt-1.5">
                        * Tamanhos marcados podem ser encomendados
                      </p>
                    )}
                  </div>
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
            <DialogTitle>Seu Pedido</DialogTitle>
          </DialogHeader>

          {cart.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Seu pedido está vazio</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Items */}
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {cart.map((item) => (
                  <div key={`${item.productId}-${item.size}`} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">Tamanho: {item.size}</p>
                      <p className="text-sm font-semibold text-primary mt-1">{fmt(item.quantity * item.unitPrice)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)} className="p-1 hover:bg-muted rounded">
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)} className="p-1 hover:bg-muted rounded">
                        <Plus className="h-4 w-4" />
                      </button>
                      <button onClick={() => removeFromCart(item.productId, item.size)} className="p-1 hover:bg-red-500/10 text-red-500 rounded ml-2">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t border-border pt-3">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold">Total:</span>
                  <span className="text-lg font-bold text-primary">{fmt(total)}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => { setShowCart(false); setShowOrder(true); }}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Pedido
                  </Button>
                  <Button
                    onClick={sendViaWhatsApp}
                    className="flex-1 bg-green-600 text-white hover:bg-green-700"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Order Dialog */}
      <Dialog open={showOrder} onOpenChange={setShowOrder}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle>Confirmar Pedido</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Seu nome"
                className="bg-muted/50 border-border"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Telefone/WhatsApp *</Label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="bg-muted/50 border-border"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Alguma observação sobre seu pedido?"
                className="bg-muted/50 border-border resize-none"
                rows={3}
              />
            </div>

            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Total do Pedido:</p>
              <p className="text-lg font-bold text-primary">{fmt(total)}</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowOrder(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitOrder}
                disabled={submitOrder.isPending}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {submitOrder.isPending ? "Enviando..." : "Confirmar Pedido"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gallery Dialog */}
      {showGallery && (
        <Dialog open={!!showGallery} onOpenChange={() => setShowGallery(null)}>
          <DialogContent className="max-w-2xl bg-card border-border">
            <DialogHeader>
              <DialogTitle>{products.find((p) => p.id === showGallery)?.name}</DialogTitle>
            </DialogHeader>

            {products.find((p) => p.id === showGallery)?.gallery && (
              <div className="space-y-4">
                <div className="aspect-square bg-muted/30 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={products.find((p) => p.id === showGallery)?.gallery?.[galleryIndex]?.imageUrl || ""}
                    alt="Galeria"
                    className="w-full h-full object-cover"
                  />
                </div>

                {(products.find((p) => p.id === showGallery)?.gallery?.length ?? 0) > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {products
                      .find((p) => p.id === showGallery)
                      ?.gallery?.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setGalleryIndex(idx)}
                          className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                            galleryIndex === idx ? "border-primary" : "border-border"
                          }`}
                        >
                          <img src={img.imageUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

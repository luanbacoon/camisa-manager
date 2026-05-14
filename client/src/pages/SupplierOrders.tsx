import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Search, Truck, CheckCircle, Package, ExternalLink, Edit2, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const SIZES = ["PP", "P", "M", "G", "GG", "XGG", "3G", "4G"];
const CURRENCIES = ["R$ Real", "$ Dólar"];
const ORDER_TYPES = ["Nacional", "Internacional"];

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

type SelectedProduct = {
  productId: number;
  size: string;
  quantity: number;
  unitCost: number;
};

export default function SupplierOrders() {
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showEdit, setShowEdit] = useState<number | null>(null);
  const [confirmReceive, setConfirmReceive] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: orders = [], isLoading } = trpc.supplierOrders.list.useQuery();
  const { data: products = [] } = trpc.products.list.useQuery({ activeOnly: true });

  const createOrder = trpc.supplierOrders.createBatch.useMutation({
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

  // New form - Produtos selecionados com quantidade por tamanho
  const [selectedProducts, setSelectedProducts] = useState<Map<number, SelectedProduct[]>>(new Map());

  // New form - Dados do pedido
  const [supplier, setSupplier] = useState("");
  const [orderType, setOrderType] = useState("Nacional");
  const [currency, setCurrency] = useState("R$ Real");
  const [orderDate, setOrderDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [deliveryDate, setDeliveryDate] = useState("");
  const [discount, setDiscount] = useState("");
  const [freight, setFreight] = useState("");
  const [notes, setNotes] = useState("");
  const [trackingCode, setTrackingCode] = useState("");

  // Seleção de tamanho e quantidade para produto específico
  const [tempProductId, setTempProductId] = useState<number | null>(null);
  const [tempSize, setTempSize] = useState("");
  const [tempQuantity, setTempQuantity] = useState("1");
  const [tempUnitCost, setTempUnitCost] = useState("");

  // Edit form
  const [editTracking, setEditTracking] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");

  function openNew() {
    setSelectedProducts(new Map());
    setSupplier("");
    setOrderType("Nacional");
    setCurrency("R$ Real");
    setOrderDate(format(new Date(), "yyyy-MM-dd"));
    setDeliveryDate("");
    setDiscount("");
    setFreight("");
    setNotes("");
    setTrackingCode("");
    setTempProductId(null);
    setTempSize("");
    setTempQuantity("1");
    setTempUnitCost("");
    setShowNew(true);
  }

  // Selecionar/desselecionar produto
  function toggleProductSelection(productId: number) {
    const newSelected = new Map(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.set(productId, []);
    }
    setSelectedProducts(newSelected);
    setTempProductId(productId);
    setTempSize("");
    setTempQuantity("1");
    setTempUnitCost("");
  }

  // Adicionar tamanho/quantidade a um produto selecionado
  function addSizeToProduct() {
    if (!tempProductId || !tempSize || !tempQuantity || !tempUnitCost) {
      return toast.error("Preencha tamanho, quantidade e preço");
    }

    const newSelected = new Map(selectedProducts);
    const currentItems = newSelected.get(tempProductId) || [];
    
    const newItem: SelectedProduct = {
      productId: tempProductId,
      size: tempSize,
      quantity: Number(tempQuantity),
      unitCost: Number(tempUnitCost),
    };

    newSelected.set(tempProductId, [...currentItems, newItem]);
    setSelectedProducts(newSelected);
    
    setTempSize("");
    setTempQuantity("1");
    setTempUnitCost("");
    toast.success(`${tempSize} adicionado!`);
  }

  // Remover tamanho específico de um produto
  function removeSizeFromProduct(productId: number, sizeIndex: number) {
    const newSelected = new Map(selectedProducts);
    const items = newSelected.get(productId) || [];
    newSelected.set(productId, items.filter((_, i) => i !== sizeIndex));
    setSelectedProducts(newSelected);
  }

  // Construir array de itens do carrinho
  const cartItems: SelectedProduct[] = useMemo(() => {
    const items: SelectedProduct[] = [];
    selectedProducts.forEach((sizes) => {
      items.push(...sizes);
    });
    return items;
  }, [selectedProducts]);

  const cartTotal = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
    const discountAmount = Number(discount) || 0;
    const freightAmount = Number(freight) || 0;
    return subtotal - discountAmount + freightAmount;
  }, [cartItems, discount, freight]);

  function submitNew() {
    if (cartItems.length === 0) return toast.error("Adicione pelo menos um item ao pedido");
    if (!supplier) return toast.error("Preencha o fornecedor");

    createOrder.mutate({
      supplier,
      orderType,
      currency,
      discount: Number(discount) || 0,
      freight: Number(freight) || 0,
      orderDate: orderDate ? new Date(orderDate) : undefined,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
      notes,
      trackingCode,
      items: cartItems,
    } as any);
  }

  function openEdit(order: typeof orders[0]) {
    setEditTracking(order.trackingCode ?? "");
    setEditStatus(order.status);
    setEditNotes(order.notes ?? "");
    setShowEdit(order.id);
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

  const filteredOrders = orders.filter((o) =>
    o.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.size?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pedidos ao Fornecedor</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus pedidos de reposição de estoque</p>
        </div>
        <Button onClick={openNew} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4" /> Novo Pedido
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por produto ou tamanho..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Data</th>
              <th className="px-4 py-3 text-left font-semibold">Produto</th>
              <th className="px-4 py-3 text-left font-semibold">Tamanho</th>
              <th className="px-4 py-3 text-right font-semibold">Qtd</th>
              <th className="px-4 py-3 text-right font-semibold">Custo Unit.</th>
              <th className="px-4 py-3 text-right font-semibold">Total</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Carregando...</td></tr>
            ) : filteredOrders.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Nenhum pedido encontrado</td></tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-border hover:bg-muted/30">
                  <td className="px-4 py-3">{format(new Date(order.orderedAt), "dd/MM/yyyy", { locale: ptBR })}</td>
                  <td className="px-4 py-3 font-medium">{order.product?.name}</td>
                  <td className="px-4 py-3">{order.size}</td>
                  <td className="px-4 py-3 text-right">{order.quantity}</td>
                  <td className="px-4 py-3 text-right">{fmt(order.unitCost)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{fmt(order.totalCost)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[order.status] || "badge-default"}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(order)}
                      className="gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Editar
                    </Button>
                    {order.status === "pendente" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmReceive(order.id)}
                        className="gap-1 text-emerald-600"
                      >
                        <CheckCircle className="w-3 h-3" /> Receber
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Novo Pedido - Layout Horizontal */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Pedido ao Fornecedor</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna 1: Dados do Pedido */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-200">
                <h3 className="font-semibold text-sm text-emerald-900 mb-3">Dados do Pedido</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium">Fornecedor *</Label>
                    <Input 
                      value={supplier} 
                      onChange={(e) => setSupplier(e.target.value)} 
                      placeholder="Nome do fornecedor"
                      className="text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Tipo de Pedido</Label>
                    <Select value={orderType} onValueChange={setOrderType}>
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Moeda</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Data do Pedido</Label>
                    <Input 
                      type="date" 
                      value={orderDate} 
                      onChange={(e) => setOrderDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Data de Entrega</Label>
                    <Input 
                      type="date" 
                      value={deliveryDate} 
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Código de Rastreio</Label>
                    <Input 
                      value={trackingCode} 
                      onChange={(e) => setTrackingCode(e.target.value)} 
                      placeholder="Ex: AA123456789BR"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Custos Adicionais */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-sm text-blue-900 mb-3">Custos Adicionais</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium">Desconto (R$)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={discount} 
                      onChange={(e) => setDiscount(e.target.value)} 
                      placeholder="0.00"
                      className="text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Frete (R$)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={freight} 
                      onChange={(e) => setFreight(e.target.value)} 
                      placeholder="0.00"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div>
                <Label className="text-xs font-medium">Observações</Label>
                <Textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Notas adicionais..." 
                  className="text-xs resize-none h-20"
                />
              </div>
            </div>

            {/* Coluna 2: Seleção de Produtos */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-sm text-purple-900 mb-3">Selecione Produtos</h3>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-purple-200 hover:bg-purple-50 transition"
                    >
                      <Checkbox 
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={() => toggleProductSelection(product.id)}
                        className="mt-1"
                      />
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => toggleProductSelection(product.id)}
                      >
                        {product.imageUrl && (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="w-full h-16 object-cover rounded mb-2"
                          />
                        )}
                        <p className="text-xs font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{fmt(product.price)}</p>
                        {selectedProducts.has(product.id) && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                            <Check className="w-3 h-3" /> {selectedProducts.get(product.id)?.length || 0} tamanho(s)
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Coluna 3: Adicionar Tamanhos e Carrinho */}
            <div className="space-y-4">
              {tempProductId && (
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                  <h3 className="font-semibold text-sm text-orange-900 mb-3">
                    Adicionar Tamanhos
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium">Tamanho *</Label>
                      <Select value={tempSize} onValueChange={setTempSize}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {SIZES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs font-medium">Quantidade *</Label>
                      <Input 
                        type="number" 
                        value={tempQuantity} 
                        onChange={(e) => setTempQuantity(e.target.value)} 
                        placeholder="0"
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-medium">Preço Unitário *</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        value={tempUnitCost} 
                        onChange={(e) => setTempUnitCost(e.target.value)} 
                        placeholder="0.00"
                        className="text-sm"
                      />
                    </div>

                    <Button 
                      onClick={addSizeToProduct} 
                      className="w-full bg-orange-600 hover:bg-orange-700 text-sm"
                    >
                      Adicionar Tamanho
                    </Button>
                  </div>
                </div>
              )}

              {/* Carrinho */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-200 flex-1">
                <h3 className="font-semibold text-sm text-emerald-900 mb-3">
                  Itens do Pedido ({cartItems.length})
                </h3>
                
                <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                  {cartItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Nenhum item adicionado</p>
                  ) : (
                    cartItems.map((item, idx) => {
                      const product = products.find((p) => p.id === item.productId);
                      return (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between p-2 bg-white rounded border border-emerald-200 text-xs"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{product?.name} - {item.size}</p>
                            <p className="text-muted-foreground">
                              {item.quantity}x {fmt(item.unitCost)} = {fmt(item.quantity * item.unitCost)}
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => {
                              const productId = item.productId;
                              const sizes = selectedProducts.get(productId) || [];
                              const sizeIndex = sizes.findIndex(s => s.size === item.size && s.quantity === item.quantity);
                              removeSizeFromProduct(productId, sizeIndex);
                            }}
                            className="ml-2"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Total */}
                <div className="border-t border-emerald-300 pt-3">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-sm">Total:</span>
                    <span className="text-lg font-bold text-emerald-700">{fmt(cartTotal)}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowNew(false)}
                      className="flex-1 text-sm"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={submitNew} 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-sm"
                      disabled={createOrder.isPending}
                    >
                      {createOrder.isPending ? "Salvando..." : "Salvar Pedido"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={showEdit !== null} onOpenChange={() => setShowEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Pedido</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Código de Rastreio</Label>
              <Input
                value={editTracking}
                onChange={(e) => setEditTracking(e.target.value)}
                placeholder="Ex: AA123456789BR"
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Notas adicionais..."
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowEdit(null)}>
                Cancelar
              </Button>
              <Button onClick={submitEdit} className="bg-primary">
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Recebimento */}
      <Dialog open={confirmReceive !== null} onOpenChange={() => setConfirmReceive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Recebimento</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja marcar este pedido como recebido? O estoque será atualizado automaticamente.
          </p>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setConfirmReceive(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => confirmReceive && markReceived.mutate({ id: confirmReceive })}
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={markReceived.isPending}
            >
              {markReceived.isPending ? "Processando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

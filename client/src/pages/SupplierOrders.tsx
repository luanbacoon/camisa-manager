"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Search, Truck, CheckCircle, Package, ExternalLink, Edit2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  // New form - Produtos selecionados
  const [cartItems, setCartItems] = useState<Array<{
    productId: number;
    size: string;
    quantity: number;
    unitCost: number;
  }>>([]);

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

  // Modal de seleção de produto
  const [selectedProductForModal, setSelectedProductForModal] = useState<number | null>(null);
  const [modalSizeQuantities, setModalSizeQuantities] = useState<Record<string, number>>({});
  const [modalUnitCost, setModalUnitCost] = useState("");

  // Formulário temporário para adicionar item (legado)
  const [tempProductId, setTempProductId] = useState("");
  const [tempSize, setTempSize] = useState("");
  const [tempQuantity, setTempQuantity] = useState("");
  const [tempUnitCost, setTempUnitCost] = useState("");

  // Edit form
  const [editTracking, setEditTracking] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");

  function openNew() {
    setCartItems([]);
    setSupplier("");
    setOrderType("Nacional");
    setCurrency("R$ Real");
    setOrderDate(format(new Date(), "yyyy-MM-dd"));
    setDeliveryDate("");
    setDiscount("");
    setFreight("");
    setNotes("");
    setTrackingCode("");
    setTempProductId("");
    setTempSize("");
    setTempQuantity("");
    setTempUnitCost("");
    setShowNew(true);
  }

  function addToCart() {
    if (!tempProductId || !tempSize || !tempQuantity || !tempUnitCost) {
      return toast.error("Preencha todos os campos do item");
    }
    const item = {
      productId: Number(tempProductId),
      size: tempSize,
      quantity: Number(tempQuantity),
      unitCost: Number(tempUnitCost),
    };
    setCartItems([...cartItems, item]);
    setTempProductId("");
    setTempSize("");
    setTempQuantity("");
    setTempUnitCost("");
  }

  function removeFromCart(index: number) {
    setCartItems(cartItems.filter((_, i) => i !== index));
  }

  function addFromModal() {
    if (!selectedProductForModal || !modalUnitCost) {
      return toast.error("Preencha o preco unitario");
    }
    const hasAnyQuantity = Object.values(modalSizeQuantities).some(q => q > 0);
    if (!hasAnyQuantity) {
      return toast.error("Adicione quantidade para pelo menos um tamanho");
    }
    const newItems = Object.entries(modalSizeQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([size, qty]) => ({
        productId: selectedProductForModal,
        size,
        quantity: qty,
        unitCost: Number(modalUnitCost),
      }));
    setCartItems([...cartItems, ...newItems]);
    setSelectedProductForModal(null);
    setModalSizeQuantities({});
    setModalUnitCost("");
    toast.success(`${newItems.length} item(ns) adicionado(s) ao pedido!`);
  }

  const cartTotal = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
    const discountAmount = Number(discount) || 0;
    const freightAmount = Number(freight) || 0;
    return subtotal - discountAmount + freightAmount;
  }, [cartItems, discount, freight]);

  function submitNew() {
    if (cartItems.length === 0) return toast.error("Adicione pelo menos um item ao pedido");
    if (!supplier) return toast.error("Preencha o fornecedor");

    // Criar pedido multi-itens de forma transacional
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
                        className="gap-1 text-emerald-600 hover:text-emerald-700"
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

      {/* Modal Novo Pedido */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto w-[98vw] !p-10">
          <DialogHeader>
            <DialogTitle>Novo Pedido ao Fornecedor</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-8 gap-4">
            {/* Coluna 1: Grid de Produtos */}
            <div className="col-span-6 border border-border rounded-lg p-4 bg-muted/30 max-h-[900px]">
              <h3 className="font-semibold mb-3 text-sm">Produtos</h3>
              <div className="grid grid-cols-1 gap-4 max-h-[850px] overflow-y-auto">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => setSelectedProductForModal(product.id)}
                    className="p-3 rounded cursor-pointer border border-border hover:border-emerald-300 hover:bg-emerald-50 transition"
                  >
                    {product.imageUrl && (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover rounded mb-2" />
                    )}
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{fmt(product.price)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna 2: Formulário */}
            <div className="col-span-2 space-y-4">
              {/* Dados do Pedido */}
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold text-sm">Dados do Pedido</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Fornecedor *</Label>
                    <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Nome do fornecedor" />
                  </div>
                  <div>
                    <Label className="text-xs">Tipo de Pedido</Label>
                    <Select value={orderType} onValueChange={setOrderType}>
                      <SelectTrigger>
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
                    <Label className="text-xs">Data do Pedido</Label>
                    <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Data de Entrega</Label>
                    <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Moeda</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
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
                    <Label className="text-xs">Código de Rastreio</Label>
                    <Input value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} placeholder="Ex: AA123456789BR" />
                  </div>
                </div>
              </div>

              {/* Adicionar Item */}
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold text-sm mb-2">Adicionar Item</h3>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <Label className="text-xs">Tamanho *</Label>
                    <Select value={tempSize} onValueChange={setTempSize}>
                      <SelectTrigger>
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
                    <Label className="text-xs">Quantidade *</Label>
                    <Input type="number" value={tempQuantity} onChange={(e) => setTempQuantity(e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <Label className="text-xs">Preço Unitário *</Label>
                    <Input type="number" step="0.01" value={tempUnitCost} onChange={(e) => setTempUnitCost(e.target.value)} placeholder="0.00" />
                  </div>
                </div>
                <Button onClick={addToCart} className="w-full bg-blue-600 hover:bg-blue-700">
                  Adicionar Item
                </Button>
              </div>

              {/* Custos Adicionais */}
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold text-sm">Custos Adicionais</h3>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <div>
                    <Label className="text-xs">Desconto (R$)</Label>
                    <Input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0.00" />
                  </div>
                  <div>
                    <Label className="text-xs">Frete (R$)</Label>
                    <Input type="number" step="0.01" value={freight} onChange={(e) => setFreight(e.target.value)} placeholder="0.00" />
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div>
                <Label className="text-xs">Observações</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionais..." className="text-xs" />
              </div>
            </div>
          </div>

          {/* Carrinho */}
          <div className="mt-6 space-y-3">
            <h3 className="font-semibold">Itens do Pedido</h3>
            {cartItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum item adicionado</p>
            ) : (
              <div className="space-y-2">
                {cartItems.map((item, idx) => {
                  const product = products.find((p) => p.id === item.productId);
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded border border-border">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{product?.name} - {item.size}</p>
                        <p className="text-xs text-muted-foreground">Qtd: {item.quantity} × {fmt(item.unitCost)} = {fmt(item.quantity * item.unitCost)}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeFromCart(idx)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total do Pedido:</span>
              <span className="text-2xl font-bold text-emerald-600">{fmt(cartTotal)}</span>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={submitNew} className="bg-emerald-600 hover:bg-emerald-700" disabled={createOrder.isPending}>
              {createOrder.isPending ? "Salvando..." : "Salvar Pedido"}
            </Button>
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
              <Input value={editTracking} onChange={(e) => setEditTracking(e.target.value)} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowEdit(null)}>Cancelar</Button>
              <Button onClick={submitEdit} disabled={updateOrder.isPending}>
                {updateOrder.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Selecao de Produto */}
      <Dialog open={selectedProductForModal !== null} onOpenChange={(open) => !open && setSelectedProductForModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedProductForModal && products.find(p => p.id === selectedProductForModal)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold mb-3 block">Selecione Tamanhos e Quantidades</Label>
              <div className="grid grid-cols-3 gap-3">
                {SIZES.map((size) => (
                  <div key={size} className="flex flex-col items-center gap-2">
                    <Label className="text-xs font-medium">{size}</Label>
                    <Input
                      type="number"
                      min="0"
                      value={modalSizeQuantities[size] || 0}
                      onChange={(e) => setModalSizeQuantities({...modalSizeQuantities, [size]: Number(e.target.value)})}
                      placeholder="0"
                      className="text-center"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm">Preco Unitario (R$) *</Label>
              <Input type="number" step="0.01" value={modalUnitCost} onChange={(e) => setModalUnitCost(e.target.value)} placeholder="0.00" />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setSelectedProductForModal(null)}>Cancelar</Button>
              <Button onClick={addFromModal} className="bg-emerald-600 hover:bg-emerald-700">Adicionar ao Pedido</Button>
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
          <p className="text-sm text-muted-foreground">Ao confirmar, o estoque será atualizado automaticamente.</p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setConfirmReceive(null)}>Cancelar</Button>
            <Button onClick={() => confirmReceive && markReceived.mutate({ id: confirmReceive })} disabled={markReceived.isPending}>
              {markReceived.isPending ? "Processando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

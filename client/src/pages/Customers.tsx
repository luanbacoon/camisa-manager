import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/SimpleToast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Search, Users, Eye, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function fmt(v: number | string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}

export default function Customers() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: customers = [], isLoading } = trpc.customers.list.useQuery();
  const { data: history = [] } = trpc.customers.history.useQuery(
    { id: showHistory! },
    { enabled: !!showHistory }
  );

  const createCustomer = trpc.customers.create.useMutation({
    onSuccess: () => { utils.customers.list.invalidate(); toast.success("Cliente cadastrado!"); setShowForm(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateCustomer = trpc.customers.update.useMutation({
    onSuccess: () => { utils.customers.list.invalidate(); toast.success("Cliente atualizado!"); setShowForm(false); },
    onError: (e) => toast.error(e.message),
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  function openNew() {
    setEditId(null);
    setName(""); setPhone(""); setEmail(""); setAddress(""); setNotes("");
    setShowForm(true);
  }

  function openEdit(c: typeof customers[0]) {
    setEditId(c.id);
    setName(c.name); setPhone(c.phone ?? ""); setEmail(c.email ?? "");
    setAddress(c.address ?? ""); setNotes(c.notes ?? "");
    setShowForm(true);
  }

  function submit() {
    if (!name.trim()) return toast.error("Nome é obrigatório");
    if (editId) {
      updateCustomer.mutate({ id: editId, name, phone, email, address, notes });
    } else {
      createCustomer.mutate({ name, phone, email, address, notes });
    }
  }

  const filtered = useMemo(
    () => customers.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? "").includes(search) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase())
    ),
    [customers, search]
  );

  const selectedCustomer = customers.find((c) => c.id === showHistory);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie sua base de clientes</p>
        </div>
        <Button onClick={openNew} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <div className="card-elegant">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone ou email..."
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
                <th>Nome</th>
                <th>Telefone</th>
                <th>Email</th>
                <th>Total Gasto</th>
                <th>Pedidos</th>
                <th>Última Compra</th>
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
                      <Users className="w-8 h-8 text-muted-foreground/40" />
                      <p className="text-muted-foreground text-sm">Nenhum cliente encontrado</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{c.name}</p>
                          {c.isDefault && <span className="badge-warning text-[10px]">Padrão</span>}
                        </div>
                      </div>
                    </td>
                    <td className="text-sm text-muted-foreground">{c.phone ?? "—"}</td>
                    <td className="text-sm text-muted-foreground">{c.email ?? "—"}</td>
                    <td className="font-semibold text-foreground">{fmt(c.totalSpent)}</td>
                    <td className="text-sm">{c.totalOrders}</td>
                    <td className="text-sm text-muted-foreground">
                      {c.lastPurchaseAt
                        ? format(new Date(c.lastPurchaseAt), "dd/MM/yyyy", { locale: ptBR })
                        : "—"}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowHistory(c.id)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {!c.isDefault && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(c)}>
                            <Edit2 className="h-3.5 w-3.5" />
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

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-muted/50 border-border" placeholder="Nome completo" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-muted/50 border-border" placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} className="bg-muted/50 border-border" placeholder="email@exemplo.com" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Endereço</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} className="bg-muted/50 border-border" placeholder="Rua, número, bairro..." />
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-muted/50 border-border resize-none" rows={2} />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button
                onClick={submit}
                disabled={createCustomer.isPending || updateCustomer.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {editId ? "Salvar" : "Cadastrar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={!!showHistory} onOpenChange={() => setShowHistory(null)}>
        <DialogContent className="max-w-2xl bg-card border-border max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico — {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="metric-card text-center">
                <p className="text-xs text-muted-foreground">Total Gasto</p>
                <p className="text-lg font-bold text-primary mt-1">{fmt(selectedCustomer?.totalSpent ?? 0)}</p>
              </div>
              <div className="metric-card text-center">
                <p className="text-xs text-muted-foreground">Pedidos</p>
                <p className="text-lg font-bold mt-1">{selectedCustomer?.totalOrders ?? 0}</p>
              </div>
              <div className="metric-card text-center">
                <p className="text-xs text-muted-foreground">Última Compra</p>
                <p className="text-sm font-medium mt-1">
                  {selectedCustomer?.lastPurchaseAt
                    ? format(new Date(selectedCustomer.lastPurchaseAt), "dd/MM/yyyy", { locale: ptBR })
                    : "—"}
                </p>
              </div>
            </div>

            <div className="card-elegant overflow-hidden">
              <table className="w-full data-table">
                <thead>
                  <tr><th>Data</th><th>Produtos</th><th>Pagamento</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-muted-foreground text-sm">Nenhuma compra registrada</td></tr>
                  ) : (
                    history.map((sale) => (
                      <tr key={sale.id}>
                        <td className="text-sm">{format(new Date(sale.createdAt), "dd/MM/yyyy", { locale: ptBR })}</td>
                        <td className="text-sm text-muted-foreground">{sale.items.length} item(s)</td>
                        <td><span className="badge-info">{sale.paymentMethod}</span></td>
                        <td className="font-semibold">{fmt(sale.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

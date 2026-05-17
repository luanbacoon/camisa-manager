import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit2, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

export default function TenantsManagement() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showUsersDialog, setShowUsersDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    plan: "basico" as const,
    maxProducts: 1000,
    maxUsers: 10,
  });

  const { data: tenantsData, isLoading, refetch } = trpc.tenants.list.useQuery();
  const { data: tenantUsersData } = trpc.tenants.listUsers.useQuery(
    { tenantId: selectedTenant?.id || 0 },
    { enabled: !!selectedTenant }
  );

  // Adaptar dados para o formato esperado
  const tenants = tenantsData ? { data: Array.isArray(tenantsData) ? tenantsData : [] } : { data: [] };
  const tenantUsers = tenantUsersData ? { data: Array.isArray(tenantUsersData) ? tenantUsersData : [] } : { data: [] };

  const createMutation = trpc.tenants.create.useMutation();
  const updateMutation = trpc.tenants.update.useMutation();

  const handleCreate = async () => {
    if (!formData.name || !formData.slug || !formData.email) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: formData.name,
        slug: formData.slug,
        email: formData.email,
        phone: formData.phone,
        plan: formData.plan as any,
      });
      toast.success("Tenant criado com sucesso!");
      setFormData({
        name: "",
        slug: "",
        email: "",
        phone: "",
        plan: "basico",
        maxProducts: 1000,
        maxUsers: 10,
      });
      setShowCreateDialog(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar tenant");
    }
  };

  const handleEdit = async () => {
    if (!selectedTenant) return;

    try {
      await updateMutation.mutateAsync({
        tenantId: selectedTenant.id,
        name: formData.name || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        plan: formData.plan as any,
      });
      toast.success("Tenant atualizado com sucesso!");
      setShowEditDialog(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar tenant");
    }
  };

  const handleToggleStatus = async (tenant: any) => {
    const newStatus = tenant.status === "ativo" ? "suspenso" : "ativo";
    try {
      await updateMutation.mutateAsync({
        tenantId: tenant.id,
        status: newStatus,
      });
      toast.success(`Tenant ${newStatus === "ativo" ? "reativado" : "suspenso"}!`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar status");
    }
  };

  const openEditDialog = (tenant: any) => {
    setSelectedTenant(tenant);
    setFormData({
      name: tenant.name,
      slug: tenant.slug,
      email: tenant.email,
      phone: tenant.phone || "",
      plan: tenant.plan || "basico",
      maxProducts: tenant.maxProducts || 1000,
      maxUsers: tenant.maxUsers || 10,
    });
    setShowEditDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativo":
        return <Badge className="bg-green-600">Ativo</Badge>;
      case "suspenso":
        return <Badge className="bg-yellow-600">Suspenso</Badge>;
      case "cancelado":
        return <Badge className="bg-red-600">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "basico":
        return <Badge variant="outline">Básico</Badge>;
      case "profissional":
        return <Badge variant="outline" className="border-blue-500">Profissional</Badge>;
      case "enterprise":
        return <Badge variant="outline" className="border-purple-500">Enterprise</Badge>;
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Tenants</h1>
          <p className="text-muted-foreground">Administre todas as lojas do sistema</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Tenant
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenants Cadastrados</CardTitle>
              <CardDescription>
            Total: {(tenants?.data || []).length} tenant(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tenants?.data || []).map((tenant: any) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell className="font-mono text-sm">{tenant.slug}</TableCell>
                    <TableCell>{tenant.email}</TableCell>
                    <TableCell>{getPlanBadge(tenant.plan)}</TableCell>
                    <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTenant(tenant);
                          setShowUsersDialog(true);
                        }}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(tenant)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(tenant)}
                        >
                          {tenant.status === "ativo" ? "Suspender" : "Reativar"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Novo Tenant</DialogTitle>
            <DialogDescription>
              Adicione uma nova loja ao sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Loja</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Loja XYZ"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                placeholder="Ex: loja-xyz"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contato@loja.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 9999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Plano</Label>
              <Select value={formData.plan} onValueChange={(value: any) => setFormData({ ...formData, plan: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basico">Básico</SelectItem>
                  <SelectItem value="profissional">Profissional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Tenant</DialogTitle>
            <DialogDescription>
              Atualize as informações da loja
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome da Loja</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-plan">Plano</Label>
              <Select value={formData.plan} onValueChange={(value: any) => setFormData({ ...formData, plan: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basico">Básico</SelectItem>
                  <SelectItem value="profissional">Profissional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEdit}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Users Dialog */}
      <Dialog open={showUsersDialog} onOpenChange={setShowUsersDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Usuários de {selectedTenant?.name}</DialogTitle>
            <DialogDescription>
              Usuários associados a este tenant
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {(tenantUsers?.data || []).length ? (
              <div className="space-y-2">
                {(tenantUsers?.data || []).map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between rounded-lg border p-2">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge>{user.role}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">Nenhum usuário associado</p>
            )}

            <Button
              variant="outline"
              onClick={() => setShowUsersDialog(false)}
              className="w-full"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

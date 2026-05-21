import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { Mail, Plus, Trash2, Copy, CheckCircle2, Clock, AlertCircle } from "lucide-react";


export function AdminClients() {
  const [email, setEmail] = useState("");
  const [storeName, setStoreName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [resendId, setResendId] = useState<number | null>(null);

  // Queries
  const invitesQuery = trpc.clientInvites.listInvites.useQuery({
    limit: 100,
  });

  // Mutations
  const sendInviteMutation = trpc.clientInvites.sendInvite.useMutation({
    onSuccess: () => {
      console.log("Convite enviado com sucesso");
      setEmail("");
      setStoreName("");
      setIsOpen(false);
      invitesQuery.refetch();
    },
    onError: (error) => {
      console.error("Erro ao enviar convite:", error.message);
    },
  });

  const deleteInviteMutation = trpc.clientInvites.deleteInvite.useMutation({
    onSuccess: () => {
      console.log("Convite deletado com sucesso");
      setDeleteId(null);
      invitesQuery.refetch();
    },
  });

  const resendInviteMutation = trpc.clientInvites.resendInvite.useMutation({
    onSuccess: () => {
      console.log("Convite reenviado com sucesso");
      setResendId(null);
      invitesQuery.refetch();
    },
  });

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !storeName) {
      alert("Preencha todos os campos");
      return;
    }
    await sendInviteMutation.mutateAsync({ email, storeName });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            <Clock className="h-3 w-3" />
            Pendente
          </div>
        );
      case "accepted":
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            <CheckCircle2 className="h-3 w-3" />
            Aceito
          </div>
        );
      case "expired":
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            <AlertCircle className="h-3 w-3" />
            Expirado
          </div>
        );
      default:
        return null;
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/client-accept-invite?token=${token}`;
    navigator.clipboard.writeText(link);
    alert("Link do convite copiado para a área de transferência");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Clientes</h1>
            <p className="text-gray-500 mt-1">Envie convites e gerencie seus clientes</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Enviar Convite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gerar Link de Convite</DialogTitle>
                <DialogDescription>
                  Gere um link e envie para o cliente via WhatsApp, SMS ou email
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email do Cliente</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="storeName">Nome da Loja</Label>
                  <Input
                    id="storeName"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Minha Loja de Camisas"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={sendInviteMutation.isPending}>
                  {sendInviteMutation.isPending ? "Gerando..." : "Gerar Link de Convite"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Convites Enviados</CardTitle>
            <CardDescription>
              {invitesQuery.data?.total || 0} convites no total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invitesQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : invitesQuery.data?.invites && invitesQuery.data.invites.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Email</th>
                      <th className="text-left py-3 px-4 font-semibold">Loja</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Data</th>
                      <th className="text-right py-3 px-4 font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitesQuery.data.invites.map((invite: any) => (
                      <tr key={invite.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{invite.email}</td>
                        <td className="py-3 px-4">{invite.storeName}</td>
                        <td className="py-3 px-4">{getStatusBadge(invite.status)}</td>
                        <td className="py-3 px-4 text-gray-500">
                          {new Date(invite.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyInviteLink(invite.token)}
                            title="Copiar link do convite"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(invite.id)}
                            title="Deletar convite"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <p>Nenhum convite enviado ainda</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Dialog */}
        <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deletar Convite?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O convite será permanentemente deletado.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3">
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteId) {
                    deleteInviteMutation.mutate({ inviteId: deleteId });
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Deletar
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Resend Dialog */}
        <AlertDialog open={resendId !== null} onOpenChange={(open) => !open && setResendId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reenviar Convite?</AlertDialogTitle>
              <AlertDialogDescription>
                O cliente receberá novamente o email com o link do convite.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3">
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (resendId) {
                    resendInviteMutation.mutate({ inviteId: resendId });
                  }
                }}
              >
                Reenviar
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}

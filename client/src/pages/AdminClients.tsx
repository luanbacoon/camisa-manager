import { useState, useEffect } from "react";
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
            Gerencie os convites enviados para seus clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitesQuery.isLoading ? (
            <p className="text-gray-500">Carregando...</p>
          ) : invitesQuery.data && invitesQuery.data.length > 0 ? (
            <div className="space-y-3">
              {invitesQuery.data.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{invite.email}</p>
                    <p className="text-sm text-gray-500">{invite.storeName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(invite.status)}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyInviteLink(invite.token)}
                      className="gap-1"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {invite.status === "pending" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setResendId(invite.id)}
                        className="gap-1"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteId(invite.id)}
                      className="gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Nenhum convite enviado ainda</p>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Convite</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este convite? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteInviteMutation.mutate({ id: deleteId });
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Deletar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resend confirmation dialog */}
      <AlertDialog open={resendId !== null} onOpenChange={() => setResendId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reenviar Convite</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja reenviar este convite?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (resendId) {
                  resendInviteMutation.mutate({ id: resendId });
                }
              }}
            >
              Reenviar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

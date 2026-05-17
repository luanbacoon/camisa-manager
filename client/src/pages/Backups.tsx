import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { HardDrive, Download, RotateCcw, Trash2, Plus, Calendar, Database } from "lucide-react";

export default function Backups() {
  const utils = trpc.useUtils();
  const { data: backups = [], isLoading } = trpc.backups.list.useQuery();
  const { data: stats } = trpc.backups.stats.useQuery();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedBackupId, setSelectedBackupId] = useState<number | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const createBackup = trpc.backups.create.useMutation({
    onSuccess: () => {
      utils.backups.list.invalidate();
      utils.backups.stats.invalidate();
      toast.success("Backup criado com sucesso!");
      setShowCreateDialog(false);
      setDescription("");
    },
    onError: (e) => toast.error(e.message),
  });

  const restoreBackup = trpc.backups.restore.useMutation({
    onSuccess: () => {
      utils.backups.list.invalidate();
      utils.backups.stats.invalidate();
      toast.success("Backup restaurado com sucesso!");
      setShowRestoreDialog(false);
      setSelectedBackupId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteBackup = trpc.backups.delete.useMutation({
    onSuccess: () => {
      utils.backups.list.invalidate();
      utils.backups.stats.invalidate();
      toast.success("Backup deletado com sucesso!");
      setShowDeleteDialog(false);
      setSelectedBackupId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreateBackup = () => {
    createBackup.mutate({ description: description || undefined });
  };

  const handleRestoreBackup = () => {
    if (selectedBackupId) {
      restoreBackup.mutate({ backupId: selectedBackupId });
    }
  };

  const handleDeleteBackup = () => {
    if (selectedBackupId) {
      deleteBackup.mutate({ backupId: selectedBackupId });
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("pt-BR");
  };

  const formatSize = (size: string) => {
    const bytes = parseInt(size);
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Backups</h1>
          <p className="text-muted-foreground">Gerenciar backups do banco de dados</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Backup
        </Button>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Backups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBackups}</div>
              <p className="text-xs text-muted-foreground">{stats.completedBackups} completos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Tamanho Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatSize(stats.totalSize.toString())}</div>
              <p className="text-xs text-muted-foreground">Espaço em disco</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Último Backup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lastBackup ? "✓" : "—"}</div>
              <p className="text-xs text-muted-foreground">
                {stats.lastBackup ? formatDate(stats.lastBackup.createdAt) : "Nenhum"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Última Restauração</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lastRestore ? "✓" : "—"}</div>
              <p className="text-xs text-muted-foreground">
                {stats.lastRestore ? formatDate(stats.lastRestore.restoredAt!) : "Nenhuma"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Backups */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Backups</CardTitle>
          <CardDescription>Todos os backups do banco de dados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando backups...</div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum backup encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Arquivo</th>
                    <th className="text-left py-3 px-4 font-semibold">Descrição</th>
                    <th className="text-left py-3 px-4 font-semibold">Tamanho</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Data</th>
                    <th className="text-right py-3 px-4 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((backup) => (
                    <tr key={backup.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono text-xs">{backup.filename}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{backup.description}</td>
                      <td className="py-3 px-4">{formatSize(backup.size)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                            backup.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : backup.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {backup.status === "completed"
                            ? "Completo"
                            : backup.status === "failed"
                              ? "Falha"
                              : "Pendente"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(backup.createdAt)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          {backup.status === "completed" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedBackupId(backup.id);
                                  setShowRestoreDialog(true);
                                }}
                                disabled={restoreBackup.isPending}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedBackupId(backup.id);
                                  setShowDeleteDialog(true);
                                }}
                                disabled={deleteBackup.isPending}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Criar Backup */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Backup</DialogTitle>
            <DialogDescription>Criar um backup manual do banco de dados</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Input
                placeholder="Ex: Backup antes de atualização"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateBackup} disabled={createBackup.isPending}>
                {createBackup.isPending ? "Criando..." : "Criar Backup"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Restaurar Backup */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar Backup?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá restaurar o banco de dados para o estado deste backup. Todos os dados posteriores serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreBackup} disabled={restoreBackup.isPending}>
              {restoreBackup.isPending ? "Restaurando..." : "Restaurar"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Deletar Backup */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Backup?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá deletar permanentemente este backup. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBackup} disabled={deleteBackup.isPending} className="bg-destructive">
              {deleteBackup.isPending ? "Deletando..." : "Deletar"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

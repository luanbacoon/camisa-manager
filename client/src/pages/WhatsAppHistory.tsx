import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, AlertCircle, Clock, MessageCircle, TrendingUp, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  enviado: {
    icon: <Clock className="h-4 w-4" />,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    label: "Enviado",
  },
  entregue: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    label: "Entregue",
  },
  lido: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    label: "Lido",
  },
  falha: {
    icon: <AlertCircle className="h-4 w-4" />,
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    label: "Falha",
  },
};

export default function WhatsAppHistory() {
  const [searchPhone, setSearchPhone] = useState("");
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [clearDays, setClearDays] = useState(0);

  const { data: stats = null } = trpc.catalog.stats.useQuery();
  const { data: history = [], isLoading } = trpc.catalog.history.useQuery({
    limit: 100,
  });

  const { data: phoneHistory = [], isLoading: isLoadingPhone } = trpc.catalog.historyByPhone.useQuery(
    { phone: selectedPhone || "" },
    { enabled: !!selectedPhone }
  );

  const utils = trpc.useUtils();
  const clearHistoryMutation = trpc.catalog.clearHistory.useMutation({
    onSuccess: () => {
      utils.catalog.history.invalidate();
      utils.catalog.historyByPhone.invalidate();
      utils.catalog.stats.invalidate();
      setShowClearDialog(false);
      setClearDays(0);
    },
    onError: (error) => {
      console.error("Erro ao limpar histórico:", error);
    },
  });

  const handleSearch = () => {
    if (searchPhone.trim()) {
      setSelectedPhone(searchPhone);
    }
  };

  const handleClearSearch = () => {
    setSelectedPhone(null);
    setSearchPhone("");
  };

  const displayHistory = selectedPhone ? phoneHistory : history;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-8 w-8 text-emerald-400" />
          <div>
            <h1 className="text-2xl font-bold">Histórico de Mensagens WhatsApp</h1>
            <p className="text-sm text-muted-foreground">
              Rastreie todas as mensagens enviadas aos clientes
            </p>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowClearDialog(true)}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Limpar Histórico
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-600">Enviado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.enviado}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-600">Entregue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.entregue}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-emerald-600">Lido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{stats.lido}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-600">Falha</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.falha}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search by Phone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Buscar por Telefone</CardTitle>
          <CardDescription>Digite o número do telefone para ver o histórico de mensagens</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ex: (11) 98765-4321 ou 5511987654321"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={!searchPhone.trim()}>
              Buscar
            </Button>
            {selectedPhone && (
              <Button variant="outline" onClick={handleClearSearch}>
                Limpar
              </Button>
            )}
          </div>
          {selectedPhone && (
            <p className="text-sm text-muted-foreground">
              Mostrando histórico para: <span className="font-semibold">{selectedPhone}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {selectedPhone ? "Histórico do Cliente" : "Histórico Recente"}
          </CardTitle>
          <CardDescription>
            {displayHistory.length} mensagem{displayHistory.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading || isLoadingPhone ? (
            <div className="text-center py-8 text-muted-foreground">Carregando histórico...</div>
          ) : displayHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {selectedPhone ? "Nenhuma mensagem encontrada para este telefone" : "Nenhuma mensagem registrada"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mensagem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayHistory.map((msg: any) => {
                    const config = STATUS_CONFIG[msg.status] || STATUS_CONFIG.enviado;
                    return (
                      <TableRow key={msg.id}>
                        <TableCell className="text-sm">
                          {format(new Date(msg.sentAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-sm">{msg.customerName}</TableCell>
                        <TableCell className="text-sm font-mono">{msg.customerPhone}</TableCell>
                        <TableCell className="text-sm">
                          {msg.orderId ? `#${msg.orderId}` : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className={config.color}>
                            <span className="flex items-center gap-1">
                              {config.icon}
                              {config.label}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate">
                          <span title={msg.messageText}>{msg.messageText}</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Messages */}
      {displayHistory.some((msg: any) => msg.status === "falha") && (
        <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-base text-red-900 dark:text-red-100">
              ⚠️ Mensagens com Falha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {displayHistory
              .filter((msg: any) => msg.status === "falha")
              .map((msg: any) => (
                <div key={msg.id} className="text-sm text-red-800 dark:text-red-200">
                  <p className="font-semibold">
                    {msg.customerName} ({msg.customerPhone})
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300">
                    {msg.errorMessage || "Erro desconhecido"}
                  </p>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Clear History Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limpar Histórico de Mensagens</DialogTitle>
            <DialogDescription>
              Escolha quantos dias de histórico deseja manter. Mensagens mais antigas serão deletadas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Manter mensagens dos últimos (dias)</label>
              <Input
                type="number"
                min="0"
                value={clearDays}
                onChange={(e) => setClearDays(parseInt(e.target.value) || 0)}
                placeholder="0 para apagar tudo"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {clearDays === 0
                  ? "Será apagado TODO o histórico"
                  : `Será mantido histórico dos últimos ${clearDays} dias`}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => clearHistoryMutation.mutate({ olderThanDays: clearDays })}
              disabled={clearHistoryMutation.isPending}
            >
              {clearHistoryMutation.isPending ? "Apagando..." : "Apagar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

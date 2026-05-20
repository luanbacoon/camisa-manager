import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Search, Download, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FilterState {
  search: string;
  action: string;
  userId: string;
  dateFrom: string;
  dateTo: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
  LOGIN: "bg-purple-100 text-purple-800",
  LOGOUT: "bg-gray-100 text-gray-800",
  EXPORT: "bg-yellow-100 text-yellow-800",
};

export function AuditLogs() {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    action: "",
    userId: "",
    dateFrom: "",
    dateTo: "",
  });

  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  // Fetch audit logs
  const { data: auditData, isLoading, refetch } = trpc.audit.list.useQuery({
    limit,
    offset,
    userId: filters.userId || undefined,
    action: filters.action || undefined,
    dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
    dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
  });

  // Filter logs by search term
  const filteredLogs = useMemo(() => {
    if (!auditData?.logs) return [];
    if (!filters.search) return auditData.logs;

    const searchLower = filters.search.toLowerCase();
    return auditData.logs.filter((log) =>
      log.action.toLowerCase().includes(searchLower) ||
      log.userId.toString().includes(searchLower) ||
      (log.changes && JSON.stringify(log.changes).toLowerCase().includes(searchLower))
    );
  }, [auditData?.logs, filters.search]);

  const handleExport = () => {
    const csv = [
      ["Data/Hora", "Usuário", "Ação", "Recurso", "Detalhes"],
      ...filteredLogs.map((log) => [
        format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
        log.userId,
        log.action,
        log.resourceId,
        JSON.stringify(log.changes || {}),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria-${format(new Date(), "yyyyMMdd-HHmmss")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      action: "",
      userId: "",
      dateFrom: "",
      dateTo: "",
    });
    setOffset(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Logs de Auditoria</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize e monitore todas as ações realizadas no sistema
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>

            {/* Action Filter */}
            <Select value={filters.action || "all"} onValueChange={(value) => setFilters({ ...filters, action: value === "all" ? "" : value })}>
              <SelectTrigger>
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                <SelectItem value="CREATE">Criar</SelectItem>
                <SelectItem value="UPDATE">Atualizar</SelectItem>
                <SelectItem value="DELETE">Deletar</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="LOGOUT">Logout</SelectItem>
                <SelectItem value="EXPORT">Exportar</SelectItem>
              </SelectContent>
            </Select>

            {/* Date From */}
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="pl-10"
              />
            </div>

            {/* Date To */}
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="pl-10"
              />
            </div>

            {/* Reset Button */}
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="w-full"
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Registros ({filteredLogs.length} de {auditData?.total || 0})
          </CardTitle>
          <CardDescription>
            Últimas ações registradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum log encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Data/Hora</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Usuário</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Ação</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Recurso</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        <span className="text-foreground">Usuário #{log.userId}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={ACTION_COLORS[log.action] || "bg-gray-100 text-gray-800"}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {log.resource} #{log.resourceId}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground max-w-xs truncate">
                        {log.changes ? JSON.stringify(log.changes).substring(0, 50) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredLogs.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {offset + 1} a {Math.min(offset + limit, auditData?.total || 0)} de {auditData?.total || 0}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= (auditData?.total || 0)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

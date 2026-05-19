import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Reports() {
  const [salesFrom, setSalesFrom] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0]
  );
  const [salesTo, setSalesTo] = useState<string>(new Date().toISOString().split("T")[0]);

  const salesReport = trpc.reports.sales.useQuery(
    {
      from: new Date(salesFrom),
      to: new Date(salesTo),
    },
    { enabled: !!salesFrom && !!salesTo }
  );

  const stockReport = trpc.reports.stock.useQuery();

  const exportSalesPDF = trpc.reports.exportSalesPDF.useMutation();
  const exportStockExcel = trpc.reports.exportStockExcel.useMutation();

  const handleExportSalesPDF = () => {
    exportSalesPDF.mutate(
      {
        from: new Date(salesFrom),
        to: new Date(salesTo),
      },
      {
        onSuccess: (data) => {
          try {
            // Converter base64 para Blob
            const binaryString = atob(data.buffer);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            
            // Criar link de download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = data.filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success('Relatório exportado com sucesso!');
          } catch (error) {
            toast.error('Erro ao exportar relatório');
          }
        },
        onError: (error) => {
          toast.error('Erro ao exportar relatório: ' + (error as any).message);
        },
      }
    );
  };

  const exportSalesExcel = trpc.reports.exportSalesExcel.useMutation();

  const handleExportSalesExcel = () => {
    exportSalesExcel.mutate(
      {
        from: new Date(salesFrom),
        to: new Date(salesTo),
      },
      {
        onSuccess: (data) => {
          try {
            // Converter base64 para Blob
            const binaryString = atob(data.buffer);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            // Criar link de download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = data.filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success('Relatório exportado com sucesso!');
          } catch (error) {
            toast.error('Erro ao exportar relatório');
          }
        },
        onError: (error) => {
          toast.error('Erro ao exportar relatório: ' + (error as any).message);
        },
      }
    );
  };

  const handleExportStockExcel = () => {
    exportStockExcel.mutate(undefined, {
      onSuccess: (data) => {
        try {
          // Converter base64 para Blob
          const binaryString = atob(data.buffer);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          
          // Criar link de download
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = data.filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          toast.success('Relatório exportado com sucesso!');
        } catch (error) {
          toast.error('Erro ao exportar relatório');
        }
      },
      onError: (error) => {
        toast.error('Erro ao exportar relatório: ' + (error as any).message);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground">Visualize e exporte relatórios de vendas e estoque</p>
      </div>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList>
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="stock">Estoque</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Vendas</CardTitle>
              <CardDescription>Analise suas vendas em um período específico</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sales-from">De</Label>
                  <Input
                    id="sales-from"
                    type="date"
                    value={salesFrom}
                    onChange={(e) => setSalesFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sales-to">Até</Label>
                  <Input
                    id="sales-to"
                    type="date"
                    value={salesTo}
                    onChange={(e) => setSalesTo(e.target.value)}
                  />
                </div>
              </div>

              {/* Dados do Relatório */}
              {salesReport.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : salesReport.isError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                  <p className="font-semibold">Erro ao carregar relatório</p>
                  <p className="text-sm">{(salesReport.error as any)?.message}</p>
                </div>
              ) : !salesReport.data?.data || salesReport.data.data.totalSales === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-muted-foreground">Nenhuma venda encontrada no período</p>
                </div>
              ) : salesReport.data?.data ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          R$ {parseFloat(salesReport.data.data.totalRevenue).toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">Receita Total</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          R$ {parseFloat(salesReport.data.data.totalProfit).toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">Lucro Total</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{salesReport.data.data.totalSales}</div>
                        <p className="text-xs text-muted-foreground">Total de Vendas</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          R$ {parseFloat(salesReport.data.data.averageTicket).toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">Ticket Médio</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{salesReport.data.data.itemsSold}</div>
                        <p className="text-xs text-muted-foreground">Itens Vendidos</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Top Produtos */}
                  {salesReport.data.data.topProducts.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Top Produtos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {salesReport.data.data.topProducts.map((product, idx) => (
                            <div key={idx} className="flex justify-between border-b pb-2">
                              <span className="text-sm">{product.name}</span>
                              <span className="text-sm font-semibold">{product.quantity} un.</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Top Clientes */}
                  {salesReport.data.data.topCustomers.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Top Clientes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {salesReport.data.data.topCustomers.map((customer, idx) => (
                            <div key={idx} className="flex justify-between border-b pb-2">
                              <span className="text-sm">{customer.name}</span>
                              <span className="text-sm font-semibold">
                                R$ {parseFloat(customer.total).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Botões de Exportação */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={handleExportSalesPDF}
                      disabled={exportSalesPDF.isPending}
                      variant="outline"
                    >
                      {exportSalesPDF.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Exportando...
                        </>
                      ) : (
                        <>
                          <FileDown className="mr-2 h-4 w-4" />
                          PDF (DOCX)
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleExportSalesExcel}
                      disabled={exportSalesExcel.isPending}
                    >
                      {exportSalesExcel.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Exportando...
                        </>
                      ) : (
                        <>
                          <FileDown className="mr-2 h-4 w-4" />
                          Excel
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Estoque</CardTitle>
              <CardDescription>Visualize o estoque atual de todos os produtos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stockReport.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : stockReport.isError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                  <p className="font-semibold">Erro ao carregar relatório</p>
                  <p className="text-sm">{(stockReport.error as any)?.message}</p>
                </div>
              ) : !stockReport.data?.data || stockReport.data.data.products.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-muted-foreground">Nenhum produto encontrado</p>
                </div>
              ) : stockReport.data?.data ? (
                <div className="space-y-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{stockReport.data.data.totalItems}</div>
                      <p className="text-xs text-muted-foreground">Total de Itens em Estoque</p>
                    </CardContent>
                  </Card>

                  {stockReport.data.data.products.map((product, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <CardDescription>{product.team}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                          {product.sizes.map((size, sizeIdx) => (
                            <div key={sizeIdx} className="rounded border p-2 text-center">
                              <div className="text-xs text-muted-foreground">{size.size}</div>
                              <div className="text-lg font-bold">{size.stock}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 border-t pt-4">
                          <p className="text-sm font-semibold">
                            Total: {product.totalStock} unidades
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Botão de Exportação */}
                  <Button
                    onClick={handleExportStockExcel}
                    disabled={exportStockExcel.isPending}
                    className="w-full"
                  >
                    {exportStockExcel.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Exportando...
                      </>
                    ) : (
                      <>
                        <FileDown className="mr-2 h-4 w-4" />
                        Exportar como Excel
                      </>
                    )}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

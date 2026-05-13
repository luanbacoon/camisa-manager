import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Calculator, TrendingDown, TrendingUp, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default function Simulator() {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [enabled, setEnabled] = useState(false);

  const { data: products = [] } = trpc.products.list.useQuery({ activeOnly: true });

  const { data: result, isLoading } = trpc.simulator.calculate.useQuery(
    {
      productId: Number(productId),
      newQuantity: Number(quantity),
      newUnitCost: Number(unitCost),
    },
    {
      enabled: enabled && !!productId && !!quantity && !!unitCost && Number(quantity) > 0 && Number(unitCost) > 0,
    }
  );

  function simulate() {
    if (!productId || !quantity || !unitCost) return;
    setEnabled(true);
  }

  const avgCostDiff = result ? result.newAvgCost - result.currentAvgCost : 0;
  const avgCostPctChange = result && result.currentAvgCost > 0
    ? ((result.newAvgCost - result.currentAvgCost) / result.currentAvgCost) * 100
    : 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Simulador de Pedidos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Simule o impacto no custo médio antes de fazer um pedido ao fornecedor
        </p>
      </div>

      {/* Info card */}
      <div className="flex items-start gap-3 bg-primary/5 border border-primary/15 rounded-xl p-4">
        <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          Informe o produto, a quantidade e o custo unitário do novo pedido. O simulador calculará
          o novo custo médio ponderado e sugerirá um preço de venda com margem de 50%.
        </p>
      </div>

      {/* Form */}
      <div className="card-elegant p-6 space-y-5">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Parâmetros do Pedido</h2>

        <div className="space-y-1.5">
          <Label>Produto</Label>
          <Select value={productId} onValueChange={(v) => { setProductId(v); setEnabled(false); }}>
            <SelectTrigger className="bg-muted/50 border-border">
              <SelectValue placeholder="Selecionar produto" />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name} {p.team ? `(${p.team})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Quantidade do Novo Pedido</Label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => { setQuantity(e.target.value); setEnabled(false); }}
              className="bg-muted/50 border-border"
              placeholder="Ex: 10"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Custo Unitário (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={unitCost}
              onChange={(e) => { setUnitCost(e.target.value); setEnabled(false); }}
              className="bg-muted/50 border-border"
              placeholder="0,00"
            />
          </div>
        </div>

        {quantity && unitCost && (
          <div className="bg-muted/30 rounded-lg p-3 text-sm">
            <p className="text-muted-foreground">
              Investimento total: <span className="text-foreground font-semibold">{fmt(Number(quantity) * Number(unitCost))}</span>
            </p>
          </div>
        )}

        <Button
          onClick={simulate}
          disabled={!productId || !quantity || !unitCost || isLoading}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
        >
          <Calculator className="h-4 w-4" />
          {isLoading ? "Calculando..." : "Simular"}
        </Button>
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-4 animate-fade-in">
          <div className="card-elegant p-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">Resultado da Simulação</h2>

            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground mb-1">{result.productName}</p>
              <p className="text-xs text-muted-foreground">
                {result.newQuantity} unidades × {fmt(result.newUnitCost)}
              </p>
            </div>

            {/* Cost comparison */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Custo Médio Atual</p>
                <p className="text-2xl font-bold text-foreground">{fmt(result.currentAvgCost)}</p>
                <p className="text-xs text-muted-foreground mt-1">{result.currentTotal} unidades recebidas</p>
              </div>

              <div className="flex flex-col items-center gap-1">
                <ArrowRight className="w-6 h-6 text-muted-foreground" />
                <span className={`text-xs font-semibold flex items-center gap-1 ${avgCostDiff > 0 ? "text-destructive" : avgCostDiff < 0 ? "text-emerald-400" : "text-muted-foreground"}`}>
                  {avgCostDiff > 0 ? <TrendingUp className="w-3 h-3" /> : avgCostDiff < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                  {avgCostDiff > 0 ? "+" : ""}{avgCostPctChange.toFixed(1)}%
                </span>
              </div>

              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Novo Custo Médio</p>
                <p className={`text-2xl font-bold ${avgCostDiff > 0 ? "text-destructive" : avgCostDiff < 0 ? "text-emerald-400" : "text-foreground"}`}>
                  {fmt(result.newAvgCost)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{result.newTotal} unidades no total</p>
              </div>
            </div>

            <div className="border-t border-border pt-4 grid grid-cols-2 gap-4">
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Estoque Atual</p>
                <p className="text-lg font-bold mt-1">{result.currentStock}</p>
                <p className="text-xs text-muted-foreground">unidades</p>
              </div>
              <div className="bg-primary/5 border border-primary/15 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Preço Sugerido</p>
                <p className="text-lg font-bold text-primary mt-1">{fmt(result.priceSuggested)}</p>
                <p className="text-xs text-muted-foreground">margem 50%</p>
              </div>
            </div>
          </div>

          {avgCostDiff > 0 && (
            <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
              <TrendingUp className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Este pedido <strong className="text-amber-400">aumentará</strong> seu custo médio em {fmt(Math.abs(avgCostDiff))} por unidade.
                Considere negociar um preço menor com o fornecedor.
              </p>
            </div>
          )}
          {avgCostDiff < 0 && (
            <div className="flex items-start gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
              <TrendingDown className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Ótimo! Este pedido <strong className="text-emerald-400">reduzirá</strong> seu custo médio em {fmt(Math.abs(avgCostDiff))} por unidade.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

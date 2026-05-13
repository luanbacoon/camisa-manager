import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Users,
  ShoppingCart,
  Percent,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

type Period = "week" | "month" | "custom";

function getPeriodDates(period: Period, customFrom?: Date, customTo?: Date) {
  const now = new Date();
  if (period === "week") return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
  if (period === "month") return { from: startOfMonth(now), to: endOfMonth(now) };
  return { from: customFrom ?? subDays(now, 30), to: customTo ?? now };
}

const periodLabels: Record<Period, string> = {
  week: "Esta semana",
  month: "Este mês",
  custom: "Período personalizado",
};

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
  delay: number;
}) {
  return (
    <div className={`metric-card animate-fade-in stagger-${delay}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>("month");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [customOpen, setCustomOpen] = useState(false);

  const { from, to } = useMemo(
    () => getPeriodDates(period, customFrom, customTo),
    [period, customFrom, customTo]
  );

  const { data: metrics, isLoading: loadingMetrics } = trpc.sales.metrics.useQuery({ from, to });
  const { data: chartData, isLoading: loadingChart } = trpc.sales.chartData.useQuery({ from, to });

  const formattedChart = useMemo(() => {
    if (!chartData) return [];
    return chartData.map((d) => ({
      ...d,
      dateLabel: format(new Date(d.date), "dd/MM", { locale: ptBR }),
    }));
  }, [chartData]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visão geral do desempenho da sua loja
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-card border-border">
                <Calendar className="h-4 w-4" />
                {periodLabels[period]}
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setPeriod("week")}>Esta semana</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPeriod("month")}>Este mês</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setPeriod("custom"); setCustomOpen(true); }}>
                Período personalizado
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {period === "custom" && (
            <Popover open={customOpen} onOpenChange={setCustomOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-card border-border">
                  {customFrom && customTo
                    ? `${format(customFrom, "dd/MM")} - ${format(customTo, "dd/MM")}`
                    : "Selecionar datas"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <DayPicker
                  mode="range"
                  selected={{ from: customFrom, to: customTo }}
                  onSelect={(range) => {
                    setCustomFrom(range?.from);
                    setCustomTo(range?.to);
                    if (range?.from && range?.to) setCustomOpen(false);
                  }}
                  locale={ptBR}
                  className="p-3"
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Period label */}
      <div className="text-xs text-muted-foreground">
        {format(from, "dd 'de' MMMM", { locale: ptBR })} —{" "}
        {format(to, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <MetricCard
          icon={DollarSign}
          label="Valor Vendido"
          value={loadingMetrics ? "—" : fmt(metrics?.totalRevenue ?? 0)}
          sub={`${metrics?.totalSales ?? 0} vendas`}
          color="bg-primary/10 text-primary"
          delay={1}
        />
        <MetricCard
          icon={TrendingUp}
          label="Lucro"
          value={loadingMetrics ? "—" : fmt(metrics?.totalProfit ?? 0)}
          color="bg-emerald-500/10 text-emerald-400"
          delay={2}
        />
        <MetricCard
          icon={ShoppingCart}
          label="Ticket Médio"
          value={loadingMetrics ? "—" : fmt(metrics?.avgTicket ?? 0)}
          color="bg-blue-500/10 text-blue-400"
          delay={3}
        />
        <MetricCard
          icon={Users}
          label="Clientes Ativos"
          value={loadingMetrics ? "—" : String(metrics?.activeCustomers ?? 0)}
          color="bg-purple-500/10 text-purple-400"
          delay={4}
        />
        <MetricCard
          icon={Percent}
          label="Margem"
          value={loadingMetrics ? "—" : `${(metrics?.margin ?? 0).toFixed(1)}%`}
          color="bg-amber-500/10 text-amber-400"
          delay={5}
        />
      </div>

      {/* Chart */}
      <div className="card-elegant p-6 animate-fade-in stagger-3">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-foreground">Faturamento</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Evolução das vendas no período</p>
          </div>
        </div>

        {loadingChart ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-muted-foreground text-sm">Carregando gráfico...</div>
          </div>
        ) : formattedChart.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2">
            <TrendingUp className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">Nenhuma venda no período selecionado</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={formattedChart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.78 0.16 85)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.78 0.16 85)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.70 0.18 140)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.70 0.18 140)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.03 250)" vertical={false} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: "oklch(0.60 0.02 250)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "oklch(0.60 0.02 250)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.17 0.025 250)",
                  border: "1px solid oklch(0.25 0.03 250)",
                  borderRadius: "8px",
                  color: "oklch(0.95 0.01 250)",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => [
                  fmt(value),
                  name === "revenue" ? "Faturamento" : "Lucro",
                ]}
                labelStyle={{ color: "oklch(0.60 0.02 250)", marginBottom: "4px" }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="oklch(0.78 0.16 85)"
                strokeWidth={2}
                fill="url(#colorRevenue)"
                dot={false}
                activeDot={{ r: 4, fill: "oklch(0.78 0.16 85)" }}
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="oklch(0.70 0.18 140)"
                strokeWidth={2}
                fill="url(#colorProfit)"
                dot={false}
                activeDot={{ r: 4, fill: "oklch(0.70 0.18 140)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        <div className="flex items-center gap-6 mt-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Faturamento</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: "oklch(0.70 0.18 140)" }} />
            <span className="text-xs text-muted-foreground">Lucro</span>
          </div>
        </div>
      </div>
    </div>
  );
}

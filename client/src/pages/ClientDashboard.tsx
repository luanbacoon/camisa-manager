import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  Users,
  ShoppingCart,
  Package,
  Settings,
  LogOut,
  Shirt,
  TrendingUp,
  Calendar,
} from "lucide-react";

export function ClientDashboard() {
  const [, setLocation] = useLocation();

  // Get dashboard data (placeholder)
  const dashboardData = {
    totalSales: 5250.00,
    totalProfit: 1850.00,
    totalCustomers: 12,
    totalProducts: 24,
  };
  const isLoading = false;
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    setLocation("/client-login");
  };

  const menuItems = [
    { icon: ShoppingCart, label: "Vendas", path: "/client/vendas", color: "bg-blue-500" },
    { icon: Users, label: "Clientes", path: "/client/clientes", color: "bg-green-500" },
    { icon: Package, label: "Produtos", path: "/client/produtos", color: "bg-purple-500" },
    { icon: BarChart3, label: "Estoque", path: "/client/estoque", color: "bg-yellow-500" },
    { icon: TrendingUp, label: "Pedidos", path: "/client/pedidos", color: "bg-red-500" },
    { icon: Settings, label: "Configurações", path: "/client/configuracoes", color: "bg-gray-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500 p-2 rounded-lg">
              <Shirt className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">CamisaManager</h1>
              <p className="text-sm text-slate-400">Portal do Cliente</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-400 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Bem-vindo ao seu portal!</h2>
          <p className="text-slate-400">Gerencie sua loja de camisas de forma simples e eficiente</p>
        </div>

        {/* Quick Stats */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Vendas (Mês)</p>
                    <p className="text-2xl font-bold text-white">
                      R$ {(dashboardData.totalSales || 0).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Lucro (Mês)</p>
                    <p className="text-2xl font-bold text-white">
                      R$ {(dashboardData.totalProfit || 0).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Clientes</p>
                    <p className="text-2xl font-bold text-white">{dashboardData.totalCustomers || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Produtos</p>
                    <p className="text-2xl font-bold text-white">{dashboardData.totalProducts || 0}</p>
                  </div>
                  <Package className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.path}
                className="bg-slate-800 border-slate-700 hover:border-yellow-500 transition-colors cursor-pointer group"
                onClick={() => setLocation(item.path)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`${item.color} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{item.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400">
                    {item.label === "Vendas" && "Registre e acompanhe suas vendas"}
                    {item.label === "Clientes" && "Gerencie seus clientes"}
                    {item.label === "Produtos" && "Cadastre e edite seus produtos"}
                    {item.label === "Estoque" && "Controle seu estoque"}
                    {item.label === "Pedidos" && "Acompanhe seus pedidos"}
                    {item.label === "Configurações" && "Configure sua loja"}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Coming Soon Notice */}
        <Card className="bg-slate-800 border-slate-700 mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-yellow-500" />
              Em Breve
            </CardTitle>
            <CardDescription>Funcionalidades adicionais estão sendo desenvolvidas</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-slate-400">
              <li>✓ Catálogo online personalizado</li>
              <li>✓ Simulador de pedidos</li>
              <li>✓ Integração com WhatsApp</li>
              <li>✓ Relatórios detalhados</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

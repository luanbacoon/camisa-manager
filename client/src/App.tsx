import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Stock from "./pages/Stock";
import SupplierOrders from "./pages/SupplierOrders";
import Simulator from "./pages/Simulator";
import Settings from "./pages/Settings";
import Catalog from "./pages/Catalog";
import CatalogOrders from "./pages/CatalogOrders";
import WhatsAppSettings from "./pages/WhatsAppSettings";
import WhatsAppHistory from "./pages/WhatsAppHistory";
import Backups from "./pages/Backups";
import { UserManagement } from "./pages/UserManagement";
import { LocalLogin } from "./pages/LocalLogin";
import Reports from "./pages/Reports";
import Suppliers from "./pages/Suppliers";
import TwoFactorSettings from "./pages/TwoFactorSettings";
import { AdminTenants } from "./pages/AdminTenants";

function DashboardRoutes() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/vendas" component={Sales} />
        <Route path="/clientes" component={Customers} />
        <Route path="/produtos" component={Products} />
        <Route path="/estoque" component={Stock} />
        <Route path="/pedidos" component={SupplierOrders} />
        <Route path="/simulador" component={Simulator} />
        <Route path="/pedidos-catalogo" component={CatalogOrders} />
        <Route path="/configuracoes" component={Settings} />
        <Route path="/whatsapp-configuracoes" component={WhatsAppSettings} />
        <Route path="/whatsapp-historico" component={WhatsAppHistory} />
        <Route path="/backups" component={Backups} />
        <Route path="/usuarios" component={UserManagement} />
        <Route path="/relatorios" component={Reports} />
        <Route path="/fornecedores" component={Suppliers} />
        <Route path="/seguranca/2fa" component={TwoFactorSettings} />
        <Route path="/admin/tenants" component={AdminTenants} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Switch>
            {/* Public catalog route - no auth needed */}
            <Route path="/catalogo" component={Catalog} />
            {/* All other routes use DashboardLayout */}
            <Route component={DashboardRoutes} />
          </Switch>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

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

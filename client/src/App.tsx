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
import { AuditLogs } from "./pages/AuditLogs";
import { ClientSignUp } from "./pages/ClientSignUp";
import { ClientLogin } from "./pages/ClientLogin";
import { ClientDashboard } from "./pages/ClientDashboard";
import { ClientSales } from "./pages/ClientSales";
import { ClientCustomers } from "./pages/ClientCustomers";
import { ClientForgotPassword } from "./pages/ClientForgotPassword";
import { ClientResetPassword } from "./pages/ClientResetPassword";
import { ClientOnboarding } from "./pages/ClientOnboarding";
import { ClientAccount } from "./pages/ClientAccount";
import { ClientWhatsApp } from "./pages/ClientWhatsApp";
import { ClientCatalog } from "./pages/ClientCatalog";
import { ClientAcceptInvite } from "./pages/ClientAcceptInvite";
import { AdminClients } from "./pages/AdminClients";

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
        <Route path="/auditoria" component={AuditLogs} />
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
          <Switch>
            {/* Public catalog route - no auth needed */}
            <Route path="/catalogo" component={Catalog} />
            {/* Client signup and login - no auth needed */}
            <Route path="/client-signup" component={ClientSignUp} />
            <Route path="/client-login" component={ClientLogin} />
            {/* Client dashboard and features */}
            <Route path="/client-dashboard" component={ClientDashboard} />
            <Route path="/client/vendas" component={ClientSales} />
            <Route path="/client/clientes" component={ClientCustomers} />
            <Route path="/client-forgot-password" component={ClientForgotPassword} />
            <Route path="/client-reset-password" component={ClientResetPassword} />
            <Route path="/client-onboarding" component={ClientOnboarding} />
            <Route path="/client-account" component={ClientAccount} />
            <Route path="/client/whatsapp" component={ClientWhatsApp} />
            <Route path="/client/catalogo" component={ClientCatalog} />
            <Route path="/client-accept-invite" component={ClientAcceptInvite} />
            {/* Admin routes */}
            <Route path="/admin/clientes" component={AdminClients} />
            {/* All other routes use DashboardLayout */}
            <Route component={DashboardRoutes} />
          </Switch>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

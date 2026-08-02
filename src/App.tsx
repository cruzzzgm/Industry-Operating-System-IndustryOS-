import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TrashProvider } from "@/contexts/TrashContext";
import { AppLayout } from "@/components/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import OrdersPage from "@/pages/OrdersPage";
import FinancePage from "@/pages/FinancePage";
import CustomersPage from "@/pages/CustomersPage";
import ProductsPage from "@/pages/ProductsPage";
import CarriersPage from "@/pages/CarriersPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TrashProvider>
        <TooltipProvider>
          <Sonner position="top-right" richColors />
          <BrowserRouter>
            <AppLayout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/pedidos" element={<OrdersPage />} />
                <Route path="/financeiro" element={<FinancePage />} />
                <Route path="/clientes" element={<CustomersPage />} />
                <Route path="/produtos" element={<ProductsPage />} />
                <Route path="/transportadoras" element={<CarriersPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </TooltipProvider>
      </TrashProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

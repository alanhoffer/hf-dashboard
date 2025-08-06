import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Production from "./pages/Production";
import Stock from "./pages/Stock";
import History from "./pages/History";
import NotFound from "./pages/NotFound";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 401 (unauthorized) errors
        if (error?.status === 401) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

// Main app layout with sidebar
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 w-full min-w-0">
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <LanguageProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                
                {/* Protected routes with sidebar */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/orders" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Orders />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/production" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Production />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/stock" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Stock />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/history" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <History />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                
                {/* 404 page */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </LanguageProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
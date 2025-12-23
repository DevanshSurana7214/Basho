import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "@/hooks/useCart";
import { AuthProvider } from "@/hooks/useAuth";
import { WishlistProvider } from "@/hooks/useWishlist";
import AnimatedRoutes from "@/components/AnimatedRoutes";
import ScrollRestoration from "@/components/ScrollRestoration";
import CartDrawer from "@/components/CartDrawer";
import { useCart } from "@/hooks/useCart";

const queryClient = new QueryClient();

// This component must be rendered inside CartProvider
function CartDrawerWrapper() {
  const { isDrawerOpen, closeDrawer } = useCart();
  return <CartDrawer open={isDrawerOpen} onClose={closeDrawer} />;
}

// Wrapper that contains CartProvider and its consumers
function CartProviderWithDrawer({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartDrawerWrapper />
    </CartProvider>
  );
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProviderWithDrawer>
            <WishlistProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ScrollRestoration />
                <AnimatedRoutes />
              </BrowserRouter>
            </WishlistProvider>
          </CartProviderWithDrawer>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;

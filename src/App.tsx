
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import Index from "./pages/Index";
import News from "./pages/News";
import Shop from "./pages/Shop";
import Servers from "./pages/Servers";
import Tournaments from "./pages/Tournaments";
import Partners from "./pages/Partners";
import TournamentDetail from "./pages/TournamentDetail";
import Profile from "./pages/Profile";
import NewsDetail from "./pages/NewsDetail";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  const prevLocation = useRef(location);

  useEffect(() => {
    if (prevLocation.current.pathname !== location.pathname) {
      if (document.startViewTransition) {
        document.startViewTransition(() => {
          prevLocation.current = location;
        });
      } else {
        prevLocation.current = location;
      }
    }
  }, [location]);

  return (
    <Routes location={location}>
      <Route path="/" element={<Index />} />
      <Route path="/news" element={<News />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/servers" element={<Servers />} />
      <Route path="/tournaments" element={<Tournaments />} />
      <Route path="/partners" element={<Partners />} />
      <Route path="/tournament/:id" element={<TournamentDetail />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/news/:id" element={<NewsDetail />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
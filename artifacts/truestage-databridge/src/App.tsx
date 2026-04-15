import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout";

import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import CreditUnionsList from "@/pages/credit-unions";
import CreditUnionDetail from "@/pages/credit-union-detail";
import IngestionList from "@/pages/ingestion";
import JobDetail from "@/pages/job-detail";
import DataQuality from "@/pages/data-quality";
import CanonicalSchema from "@/pages/canonical-schema";
import Docs from "@/pages/docs";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function AppRoutes() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/credit-unions" component={CreditUnionsList} />
        <Route path="/credit-unions/:id" component={CreditUnionDetail} />
        <Route path="/ingestion" component={IngestionList} />
        <Route path="/ingestion/:id" component={JobDetail} />
        <Route path="/data-quality" component={DataQuality} />
        <Route path="/canonical-schema" component={CanonicalSchema} />
        <Route path="/docs" component={Docs} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route component={AppRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

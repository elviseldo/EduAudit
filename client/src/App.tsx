import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { type User } from "@shared/schema";
import { useEffect, useState } from "react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import StudentDashboard from "@/pages/student-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import AuditForm from "@/pages/audit-form";
import EnergyPoll from "@/pages/energy-poll";
import AnalyticsDashboard from "@/pages/analytics-dashboard";
import SchoolSelection from "@/pages/school-selection";
import AuditingPortal from "@/pages/auditing-portal";

function Router() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);

  useEffect(() => {
    const checkSchool = () => {
      const school = localStorage.getItem("selectedSchool");
      setSelectedSchool(school);
    };

    checkSchool();
    // Listen for storage changes in the same window
    window.addEventListener('storage', checkSchool);
    // Add a small interval to check for changes if storage event doesn't fire
    const interval = setInterval(checkSchool, 500);

    return () => {
      window.removeEventListener('storage', checkSchool);
      clearInterval(interval);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show school selection if no school selected
  if (!selectedSchool) {
    return (
      <Switch>
        <Route path="/" component={SchoolSelection} />
        <Route path="/school-select" component={SchoolSelection} />
        <Route component={SchoolSelection} />
      </Switch>
    );
  }

  // Auditing portal is a special school that gets its own dedicated page
  const isAuditingPortal = selectedSchool === 'auditing';

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          {isAuditingPortal ? (
            <>
              <Route path="/" component={AuditingPortal} />
              <Route path="/audit/new" component={AuditForm} />
            </>
          ) : user?.role === 'admin' ? (
            <>
              <Route path="/" component={AdminDashboard} />
              <Route path="/analytics" component={AnalyticsDashboard} />
            </>
          ) : (
            <>
              <Route path="/" component={StudentDashboard} />
              <Route path="/audit/new" component={AuditForm} />
              <Route path="/energy-poll" component={EnergyPoll} />
            </>
          )}
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

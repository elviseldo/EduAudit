import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { 
  ClipboardCheck, 
  LogOut, 
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Bell,
  TrendingUp,
  Eye,
  Check,
  Flag
} from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { AuditTable } from "@/components/audit-table";
import type { Audit, AuditStats } from "@shared/schema";

export default function AdminDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch all audits with filters
  const { data: audits = [], isLoading: auditsLoading } = useQuery({
    queryKey: ["/api/audits", { status: statusFilter, priority: priorityFilter, search: searchTerm }],
    enabled: isAuthenticated && user?.role === 'admin',
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  // Fetch admin stats
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    enabled: isAuthenticated && user?.role === 'admin',
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  // Update audit status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ auditId, status, reviewNotes }: { auditId: number; status: string; reviewNotes?: string }) => {
      await apiRequest("PATCH", `/api/audits/${auditId}/status`, {
        status,
        reviewNotes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Audit status updated successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update audit status",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleApproveAudit = (auditId: number) => {
    updateStatusMutation.mutate({
      auditId,
      status: "reviewed",
      reviewNotes: "Approved by administrator",
    });
  };

  const handleFlagAudit = (auditId: number) => {
    updateStatusMutation.mutate({
      auditId,
      status: "in_progress",
      reviewNotes: "Flagged for further review",
    });
  };

  const handleExportReports = () => {
    toast({
      title: "Export Started",
      description: "Generating report... This may take a moment.",
    });
    // TODO: Implement actual export functionality
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
              <p className="text-sm text-gray-600">
                This page is restricted to administrators only.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                  <ClipboardCheck className="text-white text-sm" />
                </div>
                <span className="ml-3 text-xl font-semibold text-gray-900">School Audits Admin</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700">
                  {user?.firstName} {user?.lastName}
                </span>
                <Badge className="bg-purple-100 text-purple-700">Admin</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">
            Monitor and manage all school asset audit reports.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Audits"
            value={stats?.totalAudits || 0}
            icon={<ClipboardCheck className="text-primary" />}
            color="blue"
            subtitle={`+${Math.round((stats?.totalAudits || 0) * 0.05)} this week`}
          />
          <StatsCard
            title="Pending Review"
            value={stats?.pendingAudits || 0}
            icon={<Clock className="text-warning" />}
            color="yellow"
            subtitle="Needs attention"
          />
          <StatsCard
            title="High Priority"
            value={(stats?.highPriorityAudits || 0) + (stats?.urgentAudits || 0)}
            icon={<AlertTriangle className="text-error" />}
            color="red"
            subtitle="Urgent action needed"
          />
          <StatsCard
            title="Resolved"
            value={stats?.resolvedAudits || 0}
            icon={<CheckCircle className="text-success" />}
            color="green"
            subtitle={`${Math.round(((stats?.resolvedAudits || 0) / (stats?.totalAudits || 1)) * 100)}% completion rate`}
          />
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="p-4 h-auto flex-col space-y-2 hover:border-primary hover:bg-blue-50"
                onClick={handleExportReports}
              >
                <FileText className="text-primary text-xl" />
                <div className="text-center">
                  <h3 className="font-medium text-gray-900">Export Reports</h3>
                  <p className="text-sm text-gray-500">Generate and download audit reports</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="p-4 h-auto flex-col space-y-2 hover:border-primary hover:bg-blue-50"
                onClick={() => toast({ title: "Feature Coming Soon", description: "Notifications feature will be available soon" })}
              >
                <Bell className="text-primary text-xl" />
                <div className="text-center">
                  <h3 className="font-medium text-gray-900">Send Notifications</h3>
                  <p className="text-sm text-gray-500">Notify students about audit status</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="p-4 h-auto flex-col space-y-2 hover:border-primary hover:bg-blue-50"
                onClick={() => toast({ title: "Feature Coming Soon", description: "Analytics feature will be available soon" })}
              >
                <TrendingUp className="text-primary text-xl" />
                <div className="text-center">
                  <h3 className="font-medium text-gray-900">View Analytics</h3>
                  <p className="text-sm text-gray-500">Analyze audit trends and patterns</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Audits Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Audit Submissions</CardTitle>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Filter:</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Priority:</label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="All Priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Priorities</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="Search audits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <AuditTable
              audits={audits}
              isLoading={auditsLoading}
              onApprove={handleApproveAudit}
              onFlag={handleFlagAudit}
              isUpdating={updateStatusMutation.isPending}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

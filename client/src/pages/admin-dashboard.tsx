import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { 
  ClipboardCheck, 
  LogOut, 
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  TrendingUp,
  Eye,
  Check,
  Flag,
  Download,
  Zap,
  Lightbulb,
  Monitor,
  BarChart3
} from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { AuditTable } from "@/components/audit-table";
import type { Audit, AuditStats } from "@shared/schema";

export default function AdminDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
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
  const { data: audits = [], isLoading: auditsLoading } = useQuery<Audit[]>({
    queryKey: ["/api/audits", { status: statusFilter, priority: priorityFilter, search: searchTerm }],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Fetch admin stats
  const { data: stats } = useQuery<AuditStats>({
    queryKey: ["/api/stats"],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Fetch energy polls
  const { data: energyPolls = [] } = useQuery<any[]>({
    queryKey: ["/api/energy-polls"],
    enabled: isAuthenticated && user?.role === 'admin',
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

  // Role switching mutation
  const switchRoleMutation = useMutation({
    mutationFn: async ({ role, studentId, className }: { role: string; studentId?: string; className?: string }) => {
      await apiRequest("PATCH", "/api/user/profile", {
        role,
        studentId,
        className,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Role Updated",
        description: "Successfully switched to student role. Redirecting...",
      });
      // Small delay to let the user see the message, then redirect
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to switch role. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleSwitchToStudent = () => {
    const studentId = prompt("Enter your Student ID:");
    if (!studentId || !studentId.trim()) {
      if (studentId !== null) {
        toast({
          title: "Student ID Required",
          description: "Please enter a valid student ID to continue.",
          variant: "destructive",
        });
      }
      return;
    }

    const className = prompt("Enter your Class Name (e.g., Grade 7C):");
    if (!className || !className.trim()) {
      if (className !== null) {
        toast({
          title: "Class Name Required",
          description: "Please enter a valid class name to continue.",
          variant: "destructive",
        });
      }
      return;
    }

    switchRoleMutation.mutate({
      role: "student",
      studentId: studentId.trim(),
      className: className.trim(),
    });
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
    try {
      // Prepare data for Excel export
      const exportData = audits.map((audit) => ({
        'Audit ID': audit.id,
        'Asset Type': audit.assetType,
        'Item Name': audit.itemName,
        'Asset ID': audit.assetId || 'N/A',
        'Brand/Model': audit.brandModel || 'N/A',
        'Building': audit.building,
        'Floor': audit.floor,
        'Grade': audit.grade,
        'Location Notes': audit.locationNotes || 'N/A',
        'Condition': audit.condition,
        'Description': audit.description,
        'Priority': audit.priority,
        'Safety Concern': audit.safetyConcern ? 'Yes' : 'No',
        'Status': audit.status,
        'Review Notes': audit.reviewNotes || 'N/A',
        'Reviewed By': audit.reviewedBy || 'N/A',
        'Created At': new Date(audit.createdAt).toLocaleDateString(),
        'Reviewed At': audit.reviewedAt ? new Date(audit.reviewedAt).toLocaleDateString() : 'N/A',
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths for better formatting
      const columnWidths = [
        { wch: 10 }, // Audit ID
        { wch: 15 }, // Asset Type
        { wch: 20 }, // Item Name
        { wch: 12 }, // Asset ID
        { wch: 15 }, // Brand/Model
        { wch: 12 }, // Building
        { wch: 8 },  // Floor
        { wch: 12 }, // Grade
        { wch: 25 }, // Location Notes
        { wch: 12 }, // Condition
        { wch: 30 }, // Description
        { wch: 10 }, // Priority
        { wch: 12 }, // Safety Concern
        { wch: 12 }, // Status
        { wch: 25 }, // Review Notes
        { wch: 15 }, // Reviewed By
        { wch: 12 }, // Created At
        { wch: 12 }, // Reviewed At
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Reports');

      // Generate Excel file and trigger download
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `school-audit-reports-${currentDate}.xlsx`;
      
      saveAs(blob, filename);

      toast({
        title: "Export Successful",
        description: `Downloaded ${audits.length} audit reports to ${filename}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate Excel report. Please try again.",
        variant: "destructive",
      });
    }
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
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/analytics")}
                  className="text-green-600 border-green-600 hover:bg-green-50 text-sm"
                  data-testid="analytics-button"
                >
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Analytics
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSwitchToStudent}
                  disabled={switchRoleMutation.isPending}
                  className="text-blue-600 border-blue-600 hover:bg-blue-50 text-sm"
                >
                  {switchRoleMutation.isPending ? "..." : "Student"}
                </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="p-4 h-auto flex-col space-y-2 hover:border-primary hover:bg-blue-50"
                onClick={handleExportReports}
              >
                <Download className="text-primary text-xl" />
                <div className="text-center">
                  <h3 className="font-medium text-gray-900">Export to Excel</h3>
                  <p className="text-sm text-gray-500">Download audit reports as Excel file</p>
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

        {/* Energy Reports */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Energy Reports
            </CardTitle>
            <p className="text-gray-600">
              View electricity usage reports submitted by students
            </p>
          </CardHeader>
          <CardContent>
            {energyPolls && energyPolls.length > 0 ? (
              <div className="space-y-3">
                {energyPolls.slice(0, 10).map((poll: any) => (
                  <div key={poll.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-2">
                        {poll.sleepHours === 0 && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <Lightbulb className="h-4 w-4" />
                            <span className="text-sm">Lights Off</span>
                          </div>
                        )}
                        {poll.breakfastEaten && (
                          <div className="flex items-center space-x-1 text-blue-600">
                            <Monitor className="h-4 w-4" />
                            <span className="text-sm">Smart Board Off</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{poll.className}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(poll.createdAt).toLocaleDateString()} at {new Date(poll.createdAt).toLocaleTimeString()}
                        </p>
                        {poll.comments && (
                          <p className="text-sm text-gray-600 italic">"{poll.comments}"</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        {poll.sleepHours === 0 ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-red-600">✗</span>
                        )}
                        <span className="text-xs text-gray-500">Lights</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {poll.breakfastEaten ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-red-600">✗</span>
                        )}
                        <span className="text-xs text-gray-500">Board</span>
                      </div>
                    </div>
                  </div>
                ))}
                {energyPolls.length > 10 && (
                  <p className="text-sm text-gray-500 text-center">
                    Showing latest 10 reports ({energyPolls.length} total)
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No energy reports submitted yet</p>
            )}
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
                      <SelectItem value="all">All Status</SelectItem>
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
                      <SelectItem value="all">All Priorities</SelectItem>
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

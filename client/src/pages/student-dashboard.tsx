import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useSchool } from "@/hooks/useSchool";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { 
  ClipboardCheck, 
  LogOut, 
  Armchair, 
  Monitor, 
  Archive, 
  DoorOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Calendar,
  Zap,
  ChevronDown,
  Users,
  ShieldCheck,
  Search
} from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { SchoolSwitcher } from "@/pages/school-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Audit, UserAuditStats, EnergyPoll, User } from "@shared/schema";

export default function StudentDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth() as { user: User | null, isLoading: boolean, isAuthenticated: boolean };
  const { school } = useSchool();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

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

  const handleSetClass = () => {
    const className = prompt("Please enter your Class (e.g., Grade 7C):");
    if (className && className.trim()) {
      setSelectedClass(className.trim());
    } else {
      toast({
        title: "Class Required",
        description: "You must enter a class to proceed with auditing.",
        variant: "destructive"
      });
    }
  };

  // Fetch user's audits
  const { data: audits = [], isLoading: auditsLoading } = useQuery<Audit[]>({
    queryKey: ["/api/audits", { school }],
    enabled: isAuthenticated,
  });

  // Fetch user stats
  const { data: stats } = useQuery<UserAuditStats>({
    queryKey: ["/api/stats", { school }],
    enabled: isAuthenticated,
  });

  // Remove daily poll restriction - students can submit multiple reports

  // Role switching mutation
  const switchRoleMutation = useMutation({
    mutationFn: async ({ role }: { role: string }) => {
      await apiRequest("PATCH", "/api/user/profile", {
        role,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Role Updated",
        description: "Successfully switched to admin role. Redirecting...",
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
    localStorage.removeItem("selectedSchool");
    window.location.href = "/api/logout";
  };

  const handleSwitchToAdmin = () => {
    const adminCode = prompt("Enter Admin Access Code:");
    if (adminCode === "1818") {
      switchRoleMutation.mutate({
        role: "admin",
      });
    } else if (adminCode !== null) {
      toast({
        title: "Access Denied",
        description: "Invalid admin access code.",
        variant: "destructive",
      });
    }
  };

  const handleCreateAudit = (assetType: string) => {
    if (school === 'auditing' && !selectedClass) {
      handleSetClass();
      return;
    }
    const classParam = selectedClass ? `&class=${encodeURIComponent(selectedClass)}` : '';
    setLocation(`/audit/new?type=${assetType}${classParam}`);
  };

  const getAssetIcon = (assetType: string) => {
    switch (assetType) {
      case 'furniture': return <Armchair className="text-primary" />;
      case 'electronics': return <Monitor className="text-success" />;
      case 'storage': return <Archive className="text-warning" />;
      case 'infrastructure': return <DoorOpen className="text-purple-600" />;
      default: return <ClipboardCheck className="text-gray-400" />;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'reviewed': return 'Reviewed';
      case 'in_progress': return 'In Progress';
      case 'resolved': return 'Resolved';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getSchoolName = (id: string | null) => {
    switch (id) {
      case 'millennium': return 'The Millennium School';
      case 'modern': return 'Gems Modern Academy';
      case 'wellington': return 'Gems Wellington Academy';
      case 'auditing': return 'Auditing Portal';
      default: return 'Select School';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                  <ClipboardCheck className="text-white text-sm" />
                </div>
                <span className="ml-3 text-xl font-semibold text-gray-900">School Audits</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <span className="text-sm font-medium">{getSchoolName(school)}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLocation("/")}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Students</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSwitchToAdmin()}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    <span>Admins</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/analytics")}>
                    <Search className="mr-2 h-4 w-4" />
                    <span>Auditing</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700">
                  {user?.firstName} {user?.lastName}
                </span>
                <Badge className="bg-blue-100 text-primary">Student</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSwitchToAdmin}
                  disabled={switchRoleMutation.isPending}
                  className="text-purple-600 border-purple-600 hover:bg-purple-50 text-sm"
                >
                  {switchRoleMutation.isPending ? "..." : "Admin"}
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600">
            Report and track school asset conditions to help maintain our facilities.
          </p>
        </div>

        {/* Auditing School - Simplified View */}
        {school === 'auditing' ? (
          <div className="space-y-8">
            <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="h-20 w-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <ClipboardCheck className="h-10 w-10 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Audit?</h2>
              <p className="text-gray-600 mb-8 max-w-md">
                Select your class and start a new audit report. Remember, each class can only be audited once every 10 days.
              </p>
              <Button
                size="lg"
                onClick={() => handleCreateAudit('furniture')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 h-auto text-lg rounded-xl shadow-md transition-all hover:scale-105"
              >
                <Zap className="h-5 w-5 mr-3" />
                Start a New Audit
              </Button>
              {selectedClass && (
                <div className="mt-4 p-2 px-4 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-100 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Selected Class: {selectedClass}
                  <button 
                    onClick={() => setSelectedClass(null)}
                    className="ml-2 hover:text-purple-900 underline"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* Recent Audits for Auditing School */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Audit Reports</CardTitle>
              </CardHeader>
              <CardContent>
                {auditsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : audits.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No audits submitted yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {audits.map((audit: Audit) => (
                      <div key={audit.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <ClipboardCheck className="text-purple-600" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {audit.itemName} - {audit.grade}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Quantity: {audit.quantity}
                              </p>
                              <p className="text-xs text-gray-400">
                                Submitted {new Date(audit.createdAt!).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge className={getStatusColor(audit.status)}>
                              {formatStatus(audit.status)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Quick Stats (Millennium Only) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatsCard
                title="Total Audits"
                value={stats?.totalAudits || 0}
                icon={<ClipboardCheck className="text-primary" />}
                color="blue"
              />
              <StatsCard
                title="Reviewed"
                value={stats?.reviewedAudits || 0}
                icon={<CheckCircle className="text-success" />}
                color="green"
              />
              <StatsCard
                title="Pending"
                value={stats?.pendingAudits || 0}
                icon={<Clock className="text-warning" />}
                color="yellow"
              />
            </div>

            {/* Daily Energy Poll (Millennium Only) */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2" />
                  Daily Electricity Report
                </CardTitle>
                <p className="text-gray-600">
                  Help us track and reduce electrical energy usage at school.
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">Classroom Energy Reports</p>
                      <p className="text-sm text-blue-700">
                        Report when lights and smart boards are turned off in any classroom.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setLocation('/energy-poll')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    New Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Create New Audit Section (Millennium Only) */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Create New Audit</CardTitle>
                <p className="text-gray-600">
                  Report the condition of school furniture, equipment, and facilities.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className="p-6 h-auto flex-col space-y-3 border-dashed border-2 hover:border-primary hover:bg-blue-50"
                    onClick={() => handleCreateAudit('furniture')}
                  >
                    <Armchair className="text-2xl text-gray-400 group-hover:text-primary" />
                    <div className="text-center">
                      <p className="font-medium text-gray-900">Furniture</p>
                      <p className="text-sm text-gray-500">Desks, chairs, tables</p>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="p-6 h-auto flex-col space-y-3 border-dashed border-2 hover:border-primary hover:bg-blue-50"
                    onClick={() => handleCreateAudit('electronics')}
                  >
                    <Monitor className="text-2xl text-gray-400 group-hover:text-primary" />
                    <div className="text-center">
                      <p className="font-medium text-gray-900">Electronics</p>
                      <p className="text-sm text-gray-500">Screens, projectors</p>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="p-6 h-auto flex-col space-y-3 border-dashed border-2 hover:border-primary hover:bg-blue-50"
                    onClick={() => handleCreateAudit('storage')}
                  >
                    <Archive className="text-2xl text-gray-400 group-hover:text-primary" />
                    <div className="text-center">
                      <p className="font-medium text-gray-900">Storage</p>
                      <p className="text-sm text-gray-500">Lockers, cabinets</p>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="p-6 h-auto flex-col space-y-3 border-dashed border-2 hover:border-primary hover:bg-blue-50"
                    onClick={() => handleCreateAudit('infrastructure')}
                  >
                    <DoorOpen className="text-2xl text-gray-400 group-hover:text-primary" />
                    <div className="text-center">
                      <p className="font-medium text-gray-900">Infrastructure</p>
                      <p className="text-sm text-gray-500">Doors, windows, walls</p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Audits (Millennium Only) */}
            <Card>
              <CardHeader>
                <CardTitle>Your Recent Audits</CardTitle>
              </CardHeader>
              <CardContent>
                {auditsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : audits.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No audits submitted yet</p>
                    <p className="text-sm text-gray-400">Create your first audit report above</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {audits.map((audit: Audit) => (
                      <div key={audit.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              {getAssetIcon(audit.assetType)}
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {audit.itemName} - {audit.grade}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {audit.building}, {audit.floor}, {audit.grade}
                              </p>
                              <p className="text-xs text-gray-400">
                                Submitted {new Date(audit.createdAt!).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge className={getStatusColor(audit.status)}>
                              {formatStatus(audit.status)}
                            </Badge>
                            <Badge className={getConditionColor(audit.condition)}>
                              {audit.condition}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

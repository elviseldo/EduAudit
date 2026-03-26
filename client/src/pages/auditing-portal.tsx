import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  ClipboardCheck,
  LogOut,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  Armchair,
  Monitor,
  Archive,
  DoorOpen,
} from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import type { Audit } from "@shared/schema";

export default function AuditingPortal() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<string>("");

  const displayName = localStorage.getItem("userName") || user?.firstName || "Auditor";

  const { data: audits = [], isLoading } = useQuery<Audit[]>({
    queryKey: ["/api/audits?school=auditing"],
    enabled: isAuthenticated,
  });

  const totalAudits = audits.length;
  const pendingAudits = audits.filter((a) => a.status === "pending").length;
  const reviewedAudits = audits.filter((a) => a.status === "reviewed" || a.status === "resolved").length;

  const handleStartAudit = () => {
    if (!selectedClass.trim()) {
      toast({
        title: "Class Required",
        description: "Enter your class name before starting an audit.",
        variant: "destructive",
      });
      return;
    }
    setLocation(`/audit/new?type=furniture&class=${encodeURIComponent(selectedClass.trim())}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("selectedSchool");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    window.location.href = "/api/logout";
  };

  const getAssetIcon = (assetType: string) => {
    switch (assetType) {
      case "furniture": return <Armchair className="text-primary" />;
      case "electronics": return <Monitor className="text-green-600" />;
      case "storage": return <Archive className="text-yellow-600" />;
      case "infrastructure": return <DoorOpen className="text-purple-600" />;
      default: return <ClipboardCheck className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "reviewed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "resolved": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "excellent": return "bg-green-100 text-green-800";
      case "good": return "bg-blue-100 text-blue-800";
      case "fair": return "bg-yellow-100 text-yellow-800";
      case "poor": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case "pending": return "Pending Review";
      case "reviewed": return "Reviewed";
      case "in_progress": return "In Progress";
      case "resolved": return "Resolved";
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation — same as student dashboard */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                <ClipboardCheck className="text-white text-sm" />
              </div>
              <span className="ml-3 text-xl font-semibold text-gray-900">School Audits</span>
              <Badge className="ml-3 bg-purple-100 text-purple-700 border-purple-200">Auditing Portal</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{displayName}</span>
              <Badge className="bg-blue-100 text-primary">Auditor</Badge>
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
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {displayName}!
          </h1>
          <p className="text-gray-600">
            Select a class and submit audit reports for school assets.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total Audits"
            value={totalAudits}
            icon={<ClipboardCheck className="text-primary" />}
            color="blue"
          />
          <StatsCard
            title="Reviewed"
            value={reviewedAudits}
            icon={<CheckCircle className="text-success" />}
            color="green"
          />
          <StatsCard
            title="Pending"
            value={pendingAudits}
            icon={<Clock className="text-warning" />}
            color="yellow"
          />
        </div>

        {/* Start Audit Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Start a New Audit</CardTitle>
            <p className="text-gray-600">
              Enter the class you are auditing, then press Begin to open the audit form.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-1 w-full">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Class Name</label>
                <Input
                  placeholder="e.g. Grade 7C"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStartAudit()}
                  className="bg-white"
                />
              </div>
              <Button
                onClick={handleStartAudit}
                className="bg-primary hover:bg-blue-700 text-white mt-5 sm:mt-0 w-full sm:w-auto"
              >
                <Zap className="h-4 w-4 mr-2" />
                Begin Audit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit Log */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Audit Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              </div>
            ) : audits.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No audits submitted yet</p>
                <p className="text-sm text-gray-400">Start your first audit above</p>
              </div>
            ) : (
              <div className="space-y-4">
                {audits.map((audit) => (
                  <div
                    key={audit.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          {getAssetIcon(audit.assetType)}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {audit.itemName} — {audit.grade}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {audit.building}, {audit.floor}
                            {audit.quantity && audit.quantity > 1 && ` · Qty: ${audit.quantity}`}
                          </p>
                          <p className="text-xs text-gray-400">
                            Submitted {new Date(audit.createdAt!).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
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
      </div>
    </div>
  );
}

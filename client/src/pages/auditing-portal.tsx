import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  ClipboardList,
  LogOut,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  Building2,
  Package,
  MapPin,
  Calendar,
  User,
} from "lucide-react";
import type { Audit } from "@shared/schema";

const userName = localStorage.getItem("userName") || "Auditor";

export default function AuditingPortal() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [search, setSearch] = useState("");

  const { data: audits = [], isLoading } = useQuery<Audit[]>({
    queryKey: ["/api/audits", { school: "auditing" }],
    enabled: isAuthenticated,
  });

  const filteredAudits = audits.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.itemName.toLowerCase().includes(q) ||
      a.grade.toLowerCase().includes(q) ||
      a.building.toLowerCase().includes(q)
    );
  });

  const pendingCount = audits.filter((a) => a.status === "pending").length;
  const resolvedCount = audits.filter((a) => a.status === "resolved").length;
  const urgentCount = audits.filter((a) => a.priority === "urgent").length;

  const handleStartAudit = () => {
    if (!selectedClass.trim()) {
      toast({
        title: "Class Required",
        description: "Please enter a class name before starting an audit.",
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

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-100 text-amber-800 border border-amber-200",
      reviewed: "bg-emerald-100 text-emerald-800 border border-emerald-200",
      in_progress: "bg-blue-100 text-blue-800 border border-blue-200",
      resolved: "bg-gray-100 text-gray-600 border border-gray-200",
    };
    const labels: Record<string, string> = {
      pending: "Pending",
      reviewed: "Reviewed",
      in_progress: "In Progress",
      resolved: "Resolved",
    };
    return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] || "bg-gray-100 text-gray-600"}`}>{labels[status] || status}</span>;
  };

  const getPriorityDot = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: "bg-red-500",
      high: "bg-orange-500",
      medium: "bg-yellow-500",
      low: "bg-green-500",
    };
    return <span className={`inline-block w-2 h-2 rounded-full mr-2 ${colors[priority] || "bg-gray-400"}`} />;
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
      {/* Top Nav */}
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-none">Auditing Portal</p>
              <p className="text-teal-400 text-xs mt-0.5">School-Wide Asset Inspection</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
              <User className="h-3.5 w-3.5 text-teal-300" />
              <span className="text-white text-sm font-medium">{userName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-white">{audits.length}</p>
            <p className="text-white/50 text-sm mt-1">Total Reports</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-amber-400">{pendingCount}</p>
            <p className="text-amber-300/70 text-sm mt-1">Pending</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-red-400">{urgentCount}</p>
            <p className="text-red-300/70 text-sm mt-1">Urgent</p>
          </div>
        </div>

        {/* New Audit Panel */}
        <div className="bg-gradient-to-r from-teal-500/20 to-cyan-500/10 border border-teal-500/30 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <h2 className="text-white font-bold text-lg mb-1">Start a New Audit</h2>
              <p className="text-white/50 text-sm">Enter the class you're about to inspect, then begin the audit form.</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Input
                placeholder="e.g. Grade 7C"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStartAudit()}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-teal-500 h-11"
              />
              <Button
                onClick={handleStartAudit}
                className="bg-teal-500 hover:bg-teal-400 text-white h-11 px-5 shrink-0 shadow-lg shadow-teal-500/30 font-semibold"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Begin
              </Button>
            </div>
          </div>
        </div>

        {/* Audit Log */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-lg">Audit Log</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <Input
                placeholder="Search reports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 pl-9 h-9 w-48 focus-visible:ring-teal-500"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredAudits.length === 0 ? (
            <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
              <ClipboardList className="h-12 w-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 font-medium">No audit reports yet</p>
              <p className="text-white/20 text-sm mt-1">Start your first audit above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAudits.map((audit) => (
                <div
                  key={audit.id}
                  className="group bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all cursor-default"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Package className="h-5 w-5 text-teal-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-semibold truncate">{audit.itemName}</span>
                          {getPriorityDot(audit.priority)}
                          <span className="text-white/40 text-xs capitalize">{audit.priority}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-white/40 text-xs flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {audit.grade}
                          </span>
                          <span className="text-white/40 text-xs flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            <span className="capitalize">{audit.building}</span>
                          </span>
                          {audit.quantity && audit.quantity > 1 && (
                            <span className="text-white/40 text-xs">× {audit.quantity}</span>
                          )}
                        </div>
                        {audit.description && (
                          <p className="text-white/30 text-xs mt-1.5 line-clamp-1 italic">"{audit.description}"</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {getStatusBadge(audit.status)}
                      <span className="text-white/30 text-xs flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(audit.createdAt!).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

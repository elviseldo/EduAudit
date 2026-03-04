import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Check, Flag, Armchair, Monitor, Archive, DoorOpen } from "lucide-react";
import type { Audit } from "@shared/schema";

interface AuditTableProps {
  audits: Audit[];
  isLoading: boolean;
  onApprove: (auditId: number) => void;
  onFlag: (auditId: number) => void;
  isUpdating: boolean;
}

export function AuditTable({ audits, isLoading, onApprove, onFlag, isUpdating }: AuditTableProps) {
  const getAssetIcon = (assetType: string) => {
    switch (assetType) {
      case 'furniture': return <Armchair className="text-primary h-4 w-4" />;
      case 'electronics': return <Monitor className="text-green-600 h-4 w-4" />;
      case 'storage': return <Archive className="text-yellow-600 h-4 w-4" />;
      case 'infrastructure': return <DoorOpen className="text-purple-600 h-4 w-4" />;
      default: return <div className="h-4 w-4" />;
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
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
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (audits.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No audits found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Asset</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Reports</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {audits.map((audit) => (
            <TableRow key={audit.id} className="hover:bg-gray-50">
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {getAssetIcon(audit.assetType)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{audit.itemName}</div>
                    <div className="text-sm text-gray-500 capitalize">{audit.assetType}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-900">{audit.grade}</div>
                <div className="text-sm text-gray-500 capitalize">{audit.building}</div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="font-bold">
                  {audit.reportCount || 1}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getPriorityColor(audit.priority)}>
                  {audit.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(audit.status)}>
                  {formatStatus(audit.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {new Date(audit.createdAt!).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-primary hover:text-blue-600"
                    onClick={() => {
                      // TODO: Implement view audit details
                      console.log('View audit', audit.id);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {audit.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => onApprove(audit.id)}
                        disabled={isUpdating}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-yellow-600 hover:text-yellow-700"
                        onClick={() => onFlag(audit.id)}
                        disabled={isUpdating}
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

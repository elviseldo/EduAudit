import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Check, Flag, Armchair, Monitor, Archive, DoorOpen, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
                <div className="text-xs text-blue-600 font-medium mt-0.5">
                  {(() => {
                    const name = audit.reviewedBy;
                    if (!name || /^[a-z]+-[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) return '';
                    return name;
                  })()}
                </div>
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
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-primary hover:text-blue-600"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                          {getAssetIcon(audit.assetType)}
                          {audit.itemName}
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Report Details</h4>
                            <div className="mt-2 space-y-2">
                              <p><span className="font-medium">Submitted By:</span> <span className="text-primary font-semibold">{
                                (() => {
                                  const name = audit.reviewedBy;
                                  if (!name) return 'Student';
                                  // Hide raw Replit user IDs
                                  if (/^[a-z]+-[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) return 'Student';
                                  return name;
                                })()
                              }</span></p>
                              <p><span className="font-medium">Status:</span> <Badge className={getStatusColor(audit.status)}>{formatStatus(audit.status)}</Badge></p>
                              <p><span className="font-medium">Priority:</span> <Badge className={getPriorityColor(audit.priority)}>{audit.priority}</Badge></p>
                              <p><span className="font-medium">Reports:</span> <span className="font-bold">{audit.reportCount || 1} students flagged this</span></p>
                              <p><span className="font-medium">Condition:</span> <Badge className={getConditionColor(audit.condition)}>{audit.condition}</Badge></p>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Location</h4>
                            <div className="mt-2 space-y-1">
                              <p><span className="font-medium">School:</span> {audit.school.charAt(0).toUpperCase() + audit.school.slice(1)}</p>
                              <p><span className="font-medium">Building:</span> {audit.building}</p>
                              <p><span className="font-medium">Floor:</span> {audit.floor}</p>
                              <p><span className="font-medium">Grade/Class:</span> {audit.grade}</p>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Issue Description</h4>
                            <p className="mt-2 p-3 bg-gray-50 rounded-md text-gray-700 italic border-l-4 border-primary">
                              "{audit.description}"
                            </p>
                          </div>

                          {audit.reviewNotes && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Maintenance Notes</h4>
                              <p className="mt-2 p-3 bg-green-50 text-green-800 rounded-md">
                                {audit.reviewNotes}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Attached Evidence</h4>
                          {audit.photos && audit.photos.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                              {audit.photos.map((photo, idx) => (
                                <div key={idx} className="relative group">
                                  <img 
                                    src={photo} 
                                    alt={`Audit evidence ${idx + 1}`}
                                    className="rounded-lg object-cover w-full h-64 shadow-md border border-gray-200"
                                  />
                                  <a 
                                    href={photo} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="absolute bottom-2 right-2 p-2 bg-white/90 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <ExternalLink className="h-4 w-4 text-primary" />
                                  </a>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                              <p className="text-gray-500 italic">No images attached to this report</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
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

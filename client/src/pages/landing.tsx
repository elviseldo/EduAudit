import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center mb-4">
            <ClipboardCheck className="text-white text-2xl" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">School Audits</h2>
          <p className="mt-2 text-sm text-gray-600">
            Asset Management & Reporting System
          </p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Welcome to SchoolAudit
                </h3>
                <p className="text-sm text-gray-600">
                  Sign in to access the school asset management system. Report and track the condition of furniture, equipment, and facilities.
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-1">For Students</h4>
                  <p className="text-sm text-blue-700">
                    Create audit reports for school assets and track your submissions
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-1">For Administrators</h4>
                  <p className="text-sm text-purple-700">
                    Manage all audit reports and track maintenance across the school
                  </p>
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={() => window.location.href = '/api/login'}
              >
                Sign In to Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

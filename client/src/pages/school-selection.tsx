import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Building2, Lock, CheckCircle, ChevronDown, Users, ShieldCheck, Search } from "lucide-react";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SCHOOLS = [
  {
    id: "millennium",
    name: "The Millennium School",
    description: "Modern educational institution focusing on innovative learning",
    color: "from-blue-500 to-blue-600",
    code: "4ZD4D"
  }
];

export default function SchoolSelection() {
  const [, navigate] = useLocation();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [enteredCode, setEnteredCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const selectedSchool = SCHOOLS.find(s => s.id === selectedSchoolId);

  const handleVerifyCode = () => {
    if (selectedSchool && enteredCode.toUpperCase() === selectedSchool.code) {
      setIsVerified(true);
    }
  };

  const handleSelectSchool = () => {
    if (isVerified && selectedSchoolId) {
      localStorage.setItem("selectedSchool", selectedSchoolId);
      navigate("/");
    }
  };

  const handleRoleSelect = (role: string) => {
    if (selectedSchoolId) {
      localStorage.setItem("selectedSchool", selectedSchoolId);
      if (role === 'auditing') {
        // For auditing, we treat them as an admin to see analytics
        localStorage.setItem("userRole", "admin");
        window.location.href = "/analytics";
      } else if (role === 'admins') {
        localStorage.setItem("userRole", "admin");
        navigate("/");
      } else {
        localStorage.setItem("userRole", "student");
        navigate("/");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-gray-900">School Audits</h1>
          </div>
          <p className="text-lg text-gray-600">Select your school and role to get started</p>
        </div>

        <Card className="shadow-xl border-t-4 border-primary">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <CardDescription>Choose from the options below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-12 text-lg px-4 border-2">
                    <span className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      {selectedSchoolId ? "The Millennium School" : "Select School"}
                    </span>
                    <ChevronDown className="h-5 w-5 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[calc(100vw-4rem)] md:w-full max-w-md">
                  <DropdownMenuItem 
                    className="h-12 text-lg flex items-center gap-3 cursor-pointer"
                    onClick={() => {
                      setSelectedSchoolId("millennium");
                      setIsVerified(false);
                      setEnteredCode("");
                    }}
                  >
                    <Building2 className="h-5 w-5 text-blue-500" />
                    <span>The Millennium School</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {selectedSchoolId && !isVerified && (
                <div className="space-y-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      School Access Code
                    </label>
                    <Input
                      type="password"
                      placeholder="Enter 5-digit code"
                      className="h-12 text-lg text-center tracking-widest uppercase border-2 focus-visible:ring-primary"
                      value={enteredCode}
                      onChange={(e) => setEnteredCode(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleVerifyCode()}
                    />
                  </div>
                  <Button 
                    className="w-full h-12 text-lg shadow-md"
                    onClick={handleVerifyCode}
                  >
                    Verify School
                  </Button>
                </div>
              )}

              {isVerified && (selectedSchoolId === "millennium") && (
                <div className="space-y-3 pt-4 border-t border-gray-100 animate-in zoom-in duration-300">
                  <div className="flex items-center justify-center gap-2 py-2 px-4 bg-green-50 text-green-700 rounded-full text-sm font-semibold mb-4">
                    <CheckCircle className="h-4 w-4" />
                    Verified: The Millennium School
                  </div>
                  
                  <p className="text-sm font-medium text-gray-500 mb-2">Continue as:</p>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <Button 
                      variant="outline" 
                      className="h-14 justify-start gap-4 text-lg border-2 hover:border-blue-500 hover:bg-blue-50 transition-all"
                      onClick={() => handleRoleSelect('students')}
                    >
                      <Users className="h-6 w-6 text-blue-500" />
                      <div className="text-left">
                        <div className="font-bold">Students</div>
                        <div className="text-xs text-gray-500 font-normal">Create and view your audits</div>
                      </div>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-14 justify-start gap-4 text-lg border-2 hover:border-purple-500 hover:bg-purple-50 transition-all"
                      onClick={() => handleRoleSelect('admins')}
                    >
                      <ShieldCheck className="h-6 w-6 text-purple-500" />
                      <div className="text-left">
                        <div className="font-bold">Admins</div>
                        <div className="text-xs text-gray-500 font-normal">Manage reports and school data</div>
                      </div>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="h-14 justify-start gap-4 text-lg border-2 hover:border-green-500 hover:bg-green-50 transition-all"
                      onClick={() => handleRoleSelect('auditing')}
                    >
                      <Search className="h-6 w-6 text-green-500" />
                      <div className="text-left">
                        <div className="font-bold">Auditing</div>
                        <div className="text-xs text-gray-500 font-normal">View school-wide audit analytics</div>
                      </div>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-8">
          The Millennium School Audit Management System v1.2
        </p>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Building2, Lock, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

const SCHOOLS = [
  {
    id: "millennium",
    name: "The Millennium School",
    description: "Modern educational institution focusing on innovative learning",
    color: "from-blue-500 to-blue-600",
    code: "4ZD4D"
  },
  {
    id: "auditing",
    name: "Auditing",
    description: "Access point for general school audit reporting and monitoring",
    color: "from-purple-500 to-purple-600",
    code: "1234"
  }
];

export default function SchoolSelection() {
  const [, navigate] = useLocation();
  const [enteredCodes, setEnteredCodes] = useState<Record<string, string>>({});
  const [verifiedSchools, setVerifiedSchools] = useState<Record<string, boolean>>({});

  const handleCodeChange = (schoolId: string, value: string) => {
    setEnteredCodes(prev => ({
      ...prev,
      [schoolId]: value.toUpperCase()
    }));
  };

  const handleVerifyCode = (schoolId: string, correctCode: string) => {
    if (enteredCodes[schoolId] === correctCode) {
      setVerifiedSchools(prev => ({
        ...prev,
        [schoolId]: true
      }));
    }
  };

  const handleSelectSchool = (schoolId: string) => {
    if (verifiedSchools[schoolId]) {
      localStorage.setItem("selectedSchool", schoolId);
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-gray-900">School Audits</h1>
          </div>
          <p className="text-lg text-gray-600">Enter your school access code to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SCHOOLS.map((school) => (
            <Card 
              key={school.id} 
              className={`transition-all ${verifiedSchools[school.id] ? 'ring-2 ring-green-500 shadow-lg' : 'hover:shadow-lg'}`}
            >
              <CardHeader className={`bg-gradient-to-r ${school.color} text-white`}>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {school.name}
                </CardTitle>
                <CardDescription className="text-gray-100">
                  {school.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {verifiedSchools[school.id] ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-green-700 font-medium">Code verified</span>
                    </div>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700" 
                      onClick={() => handleSelectSchool(school.id)}
                      data-testid={`select-school-${school.id}`}
                    >
                      Select {school.name}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                        <Lock className="h-4 w-4" />
                        School Access Code
                      </label>
                      <Input
                        type="password"
                        placeholder="Enter access code"
                        value={enteredCodes[school.id] || ''}
                        onChange={(e) => handleCodeChange(school.id, e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleVerifyCode(school.id, school.code);
                          }
                        }}
                        data-testid={`code-input-${school.id}`}
                        className="uppercase"
                      />
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => handleVerifyCode(school.id, school.code)}
                      variant="outline"
                      data-testid={`verify-code-${school.id}`}
                    >
                      Verify Code
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          Your school selection will be saved in your browser
        </p>
      </div>
    </div>
  );
}

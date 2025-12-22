import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { useLocation } from "wouter";

const SCHOOLS = [
  {
    id: "millennium",
    name: "The Millennium School",
    description: "Modern educational institution focusing on innovative learning",
    color: "from-blue-500 to-blue-600"
  },
  {
    id: "experimental",
    name: "Experimental School",
    description: "Forward-thinking school with experimental teaching methods",
    color: "from-purple-500 to-purple-600"
  }
];

export default function SchoolSelection() {
  const [, navigate] = useLocation();

  const handleSelectSchool = (schoolId: string) => {
    localStorage.setItem("selectedSchool", schoolId);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-gray-900">School Audits</h1>
          </div>
          <p className="text-lg text-gray-600">Select your school to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SCHOOLS.map((school) => (
            <Card 
              key={school.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => handleSelectSchool(school.id)}
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
                <Button 
                  className="w-full" 
                  onClick={() => handleSelectSchool(school.id)}
                  data-testid={`select-school-${school.id}`}
                >
                  Select {school.name}
                </Button>
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

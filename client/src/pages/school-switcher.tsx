import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Building2 } from "lucide-react";
import { useSchool } from "@/hooks/useSchool";
import { useLocation } from "wouter";

const SCHOOLS = [
  { id: "millennium", name: "The Millennium School" },
  { id: "experimental", name: "Experimental School" },
];

export function SchoolSwitcher() {
  const { school, selectSchool } = useSchool();
  const [, navigate] = useLocation();
  
  const currentSchool = SCHOOLS.find(s => s.id === school);

  const handleSelectSchool = (schoolId: string) => {
    selectSchool(schoolId);
    navigate("/");
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Building2 className="h-4 w-4" />
          {currentSchool?.name || "Select School"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SCHOOLS.map((s) => (
          <DropdownMenuItem
            key={s.id}
            onClick={() => handleSelectSchool(s.id)}
            className={school === s.id ? "bg-accent" : ""}
          >
            {s.name}
            {school === s.id && " ✓"}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleSelectSchool("")}
          className="text-red-600"
        >
          Change School
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red';
  subtitle?: string;
}

export function StatsCard({ title, value, icon, color, subtitle }: StatsCardProps) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-100';
      case 'green': return 'bg-green-100';
      case 'yellow': return 'bg-yellow-100';
      case 'red': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-full ${getColorClasses(color)} mr-4`}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

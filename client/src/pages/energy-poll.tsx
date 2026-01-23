import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Zap, Lightbulb, Monitor, AirVent, Thermometer } from "lucide-react";

export default function EnergyPoll() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [className, setClassName] = useState("");
  const [lightsOff, setLightsOff] = useState(false);
  const [smartBoardOff, setSmartBoardOff] = useState(false);
  const [comments, setComments] = useState("");

  // Remove the daily limit check - students can submit multiple reports

  // Submit energy poll mutation
  const submitPollMutation = useMutation({
    mutationFn: async (pollData: any) => {
      await apiRequest("POST", "/api/energy-polls", pollData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/energy-polls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/energy-polls", { school: user?.school || localStorage.getItem("selectedSchool") }] });
      toast({
        title: "Energy Poll Submitted!",
        description: "Thank you for sharing your energy level today.",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit energy poll. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!className.trim()) {
      toast({
        title: "Class Required",
        description: "Please enter which class you're reporting for.",
        variant: "destructive",
      });
      return;
    }

    submitPollMutation.mutate({
      energyLevel: lightsOff ? 5 : 1, // Use lights status for energy level
      lightsOff,
      smartBoardOff,
      mood: "comfortable", // Default value
      sleepHours: lightsOff ? 0 : 1, // 0 if lights off, 1 if left on
      breakfastEaten: smartBoardOff, // Use smart board status
      physicalActivity: "none", // Default value
      comments: comments.trim() || null,
      className: className.trim(),
      school: user?.school || localStorage.getItem("selectedSchool") || 'millennium'
    });
  };

  // Remove the daily limit - students can submit multiple reports

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Daily Electricity Report</h1>
              <p className="text-gray-600">Help us track and reduce electrical energy usage at school</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2 text-primary" />
                Classroom Electricity Usage Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Class Name */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Which Class?
                </Label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g., Math 7A, English 8B, Science 9C"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Lights Turned Off */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Lights
                </Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lights"
                    checked={lightsOff}
                    onCheckedChange={(checked) => setLightsOff(checked === true)}
                  />
                  <Label htmlFor="lights">Lights were turned off when leaving the classroom</Label>
                </div>
              </div>

              {/* Smart Board Turned Off */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center">
                  <Monitor className="h-4 w-4 mr-2" />
                  Smart Board
                </Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="smartboard"
                    checked={smartBoardOff}
                    onCheckedChange={(checked) => setSmartBoardOff(checked === true)}
                  />
                  <Label htmlFor="smartboard">Smart board was turned off after use</Label>
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Additional Notes (Optional)
                </Label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Any additional observations about energy usage?"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={submitPollMutation.isPending}
              >
                {submitPollMutation.isPending ? "Submitting..." : "Submit Report"}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
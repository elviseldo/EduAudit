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

  const [energyLevel, setEnergyLevel] = useState([3]); // 1-5 scale for classroom energy efficiency
  const [mood, setMood] = useState(""); // Room temperature comfort
  const [sleepHours, setSleepHours] = useState(0); // Lights left on count
  const [breakfastEaten, setBreakfastEaten] = useState(false); // Electronics properly turned off
  const [physicalActivity, setPhysicalActivity] = useState(""); // HVAC usage level
  const [comments, setComments] = useState("");

  // Check if already submitted today
  const { data: todaysPoll } = useQuery({
    queryKey: ["/api/energy-polls/today"],
    enabled: isAuthenticated,
  });

  // Submit energy poll mutation
  const submitPollMutation = useMutation({
    mutationFn: async (pollData: any) => {
      await apiRequest("POST", "/api/energy-polls", pollData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/energy-polls"] });
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
    
    if (!mood) {
      toast({
        title: "Mood Required",
        description: "Please select your current mood.",
        variant: "destructive",
      });
      return;
    }

    if (!physicalActivity) {
      toast({
        title: "Physical Activity Required",
        description: "Please select your physical activity level.",
        variant: "destructive",
      });
      return;
    }

    submitPollMutation.mutate({
      energyLevel: energyLevel[0],
      mood,
      sleepHours,
      breakfastEaten,
      physicalActivity,
      comments: comments.trim() || null,
    });
  };

  if (todaysPoll) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <Zap className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">Already Submitted</h1>
              <p className="text-sm text-gray-600 mb-4">
                You've already submitted your electricity usage report for today. Thank you!
              </p>
              <Button onClick={() => setLocation("/")} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              {/* Energy Efficiency */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Classroom Energy Efficiency: {energyLevel[0]}/5
                </Label>
                <Slider
                  value={energyLevel}
                  onValueChange={setEnergyLevel}
                  max={5}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Poor</span>
                  <span>Excellent</span>
                </div>
                <p className="text-xs text-gray-600">Rate how efficiently electricity was used in your classroom today</p>
              </div>

              {/* Room Temperature */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center">
                  <Thermometer className="h-4 w-4 mr-2" />
                  Room Temperature Comfort
                </Label>
                <RadioGroup value={mood} onValueChange={setMood}>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="too_cold" id="too_cold" />
                      <Label htmlFor="too_cold">❄️ Too Cold - Heating needed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="comfortable" id="comfortable" />
                      <Label htmlFor="comfortable">✅ Comfortable - No adjustments needed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="too_warm" id="too_warm" />
                      <Label htmlFor="too_warm">🔥 Too Warm - Cooling needed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="stuffy" id="stuffy" />
                      <Label htmlFor="stuffy">💨 Stuffy - Ventilation needed</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Lights Left On */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Lights Left On After Class
                </Label>
                <Select value={sleepHours.toString()} onValueChange={(value) => setSleepHours(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 lights - All turned off</SelectItem>
                    <SelectItem value="1">1-2 lights left on</SelectItem>
                    <SelectItem value="2">3-5 lights left on</SelectItem>
                    <SelectItem value="3">6+ lights left on</SelectItem>
                    <SelectItem value="4">All lights left on</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Electronics Turned Off */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center">
                  <Monitor className="h-4 w-4 mr-2" />
                  Electronics Management
                </Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="electronics"
                    checked={breakfastEaten}
                    onCheckedChange={(checked) => setBreakfastEaten(checked === true)}
                  />
                  <Label htmlFor="electronics">All electronics were properly turned off after use</Label>
                </div>
              </div>

              {/* HVAC Usage */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center">
                  <AirVent className="h-4 w-4 mr-2" />
                  Heating/Cooling Usage
                </Label>
                <RadioGroup value={physicalActivity} onValueChange={setPhysicalActivity}>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="none" />
                      <Label htmlFor="none">None - No heating or cooling used</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="light" id="light" />
                      <Label htmlFor="light">Minimal - Brief use only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="moderate" id="moderate" />
                      <Label htmlFor="moderate">Moderate - Used as needed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="intense" id="intense" />
                      <Label htmlFor="intense">Heavy - Continuous use throughout day</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Comments */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Energy Savings Suggestions (Optional)
                </Label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Any ideas for saving electricity in your classroom or school?"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={submitPollMutation.isPending}
              >
                {submitPollMutation.isPending ? "Submitting..." : "Submit Electricity Report"}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
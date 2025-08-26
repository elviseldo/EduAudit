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
import { ArrowLeft, Battery, Moon, Coffee, Activity } from "lucide-react";

export default function EnergyPoll() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [energyLevel, setEnergyLevel] = useState([5]);
  const [mood, setMood] = useState("");
  const [sleepHours, setSleepHours] = useState(8);
  const [breakfastEaten, setBreakfastEaten] = useState(false);
  const [physicalActivity, setPhysicalActivity] = useState("");
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
              <Battery className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">Already Submitted</h1>
              <p className="text-sm text-gray-600 mb-4">
                You've already submitted your energy poll for today. Thank you!
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
              <h1 className="text-2xl font-bold text-gray-900">Daily Energy Poll</h1>
              <p className="text-gray-600">Help us understand how you're feeling today</p>
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
                <Battery className="h-5 w-5 mr-2 text-primary" />
                How are you feeling today?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Energy Level */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Energy Level: {energyLevel[0]}/10
                </Label>
                <Slider
                  value={energyLevel}
                  onValueChange={setEnergyLevel}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Very Low</span>
                  <span>Very High</span>
                </div>
              </div>

              {/* Mood */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Current Mood</Label>
                <RadioGroup value={mood} onValueChange={setMood}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="happy" id="happy" />
                      <Label htmlFor="happy">😊 Happy</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="focused" id="focused" />
                      <Label htmlFor="focused">🎯 Focused</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="tired" id="tired" />
                      <Label htmlFor="tired">😴 Tired</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="stressed" id="stressed" />
                      <Label htmlFor="stressed">😰 Stressed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="excited" id="excited" />
                      <Label htmlFor="excited">🤩 Excited</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="calm" id="calm" />
                      <Label htmlFor="calm">😌 Calm</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Sleep Hours */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center">
                  <Moon className="h-4 w-4 mr-2" />
                  Hours of Sleep Last Night
                </Label>
                <Select value={sleepHours.toString()} onValueChange={(value) => setSleepHours(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 3).map((hours) => (
                      <SelectItem key={hours} value={hours.toString()}>
                        {hours} hours
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Breakfast */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center">
                  <Coffee className="h-4 w-4 mr-2" />
                  Breakfast
                </Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="breakfast"
                    checked={breakfastEaten}
                    onCheckedChange={setBreakfastEaten}
                  />
                  <Label htmlFor="breakfast">I ate breakfast this morning</Label>
                </div>
              </div>

              {/* Physical Activity */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  Physical Activity Level
                </Label>
                <RadioGroup value={physicalActivity} onValueChange={setPhysicalActivity}>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="none" />
                      <Label htmlFor="none">None - mostly sitting/resting</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="light" id="light" />
                      <Label htmlFor="light">Light - walking, light stretching</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="moderate" id="moderate" />
                      <Label htmlFor="moderate">Moderate - sports, gym, cycling</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="intense" id="intense" />
                      <Label htmlFor="intense">Intense - running, competitive sports</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Comments */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Additional Comments (Optional)
                </Label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Anything else affecting your energy today?"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={submitPollMutation.isPending}
              >
                {submitPollMutation.isPending ? "Submitting..." : "Submit Energy Poll"}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useSchool } from "@/hooks/useSchool";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { ArrowLeft, ClipboardCheck, Camera, Upload, Star, ThumbsUp, AlertTriangle, XCircle } from "lucide-react";
import { insertAuditSchema } from "@shared/schema";
import { z } from "zod";

const auditFormSchema = insertAuditSchema.extend({
  grade: z.string().min(1, "Grade/Class is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  safetyConcern: z.boolean().default(false),
  description: z.string().min(1, "Detailed description is required"),
  otherItemSpecification: z.string().optional(),
}).refine(data => {
  if (data.itemName === "Others (please specify)" && (!data.otherItemSpecification || data.otherItemSpecification.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Please specify the item name",
  path: ["otherItemSpecification"]
});

type AuditFormData = z.infer<typeof auditFormSchema>;

const AUDITING_ITEMS = [
  "Student Desks",
  "Smart Board",
  "White Board",
  "Lockers",
  "Student Chairs",
  "Doors",
  "Lights",
  "Others (please specify)"
];

export default function AuditForm() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { school } = useSchool();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [photos, setPhotos] = useState<File[]>([]);

  // Get asset type and pre-selected class from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const assetType = urlParams.get('type') || '';
  const preSelectedClass = urlParams.get('class') || '';

  const form = useForm<AuditFormData>({
    resolver: zodResolver(auditFormSchema),
    defaultValues: {
      userId: user?.id || '',
      assetType: assetType || '',
      itemName: '',
      assetId: '',
      brandModel: '',
      building: school === 'auditing' ? 'Auditing Area' : '',
      floor: school === 'auditing' ? 'N/A' : '',
      grade: preSelectedClass || '',
      quantity: 1,
      locationNotes: '',
      condition: '',
      description: '',
      priority: '',
      safetyConcern: false,
      status: 'pending',
      photos: [],
      otherItemSpecification: '',
    },
  });

  // Create audit mutation
  const createAuditMutation = useMutation({
    mutationFn: async (data: AuditFormData) => {
      // Create a copy of the data to avoid modifying the original
      const auditData = {
        ...data,
        school: localStorage.getItem('selectedSchool') || school || 'millennium',
        // In a real app, we would upload files to a service like S3 or Cloudinary
        // and store the returned URLs. For this demo, we'll use base64 strings
        // or temporary object URLs if we had a preview system.
        // Let's convert our file objects to base64 for the mock storage
        photos: await Promise.all(photos.map(file => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        })),
        reviewedBy: (() => {
          const saved = localStorage.getItem("userName");
          if (saved && saved.trim()) return saved.trim();
          const name = user?.firstName;
          // Avoid showing raw Replit user IDs (they contain hyphens and numbers)
          if (name && !/^[a-z]+-[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) return name;
          return 'Student';
        })(),
      };
      await apiRequest("POST", "/api/audits", auditData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits", school] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats", school] });
      toast({
        title: "Success",
        description: "Audit report submitted successfully",
      });
      setLocation('/');
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to submit audit report",
        variant: "destructive",
      });
    },
  });

  const handleGoBack = () => {
    setLocation('/');
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + photos.length > 5) {
      toast({
        title: "Too many photos",
        description: "Maximum 5 photos allowed",
        variant: "destructive",
      });
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    setPhotos(prev => [...prev, ...validFiles]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: AuditFormData) => {
    const finalData = {
      ...data,
      itemName: data.itemName === "Others (please specify)" ? data.otherItemSpecification || data.itemName : data.itemName
    };
    createAuditMutation.mutate(finalData as AuditFormData);
  };

  const handleSafetyConcernChange = (value: string) => {
    form.setValue('safetyConcern', value === 'yes');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                className="mr-4 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center">
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                  <ClipboardCheck className="text-white text-sm" />
                </div>
                <span className="ml-3 text-xl font-semibold text-gray-900">Create New Audit</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Asset Information */}
            <Card>
              <CardHeader>
                <CardTitle>Asset Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="assetType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asset Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select asset type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="furniture">Furniture</SelectItem>
                            <SelectItem value="electronics">Electronics</SelectItem>
                            <SelectItem value="storage">Storage</SelectItem>
                            <SelectItem value="infrastructure">Infrastructure</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="itemName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specific Item</FormLabel>
                        {school === 'auditing' ? (
                          <div className="space-y-4">
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select item" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {AUDITING_ITEMS.map(item => (
                                  <SelectItem key={item} value={item}>{item}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {field.value === "Others (please specify)" && (
                              <FormField
                                control={form.control}
                                name="otherItemSpecification"
                                render={({ field: specField }) => (
                                  <FormItem>
                                    <FormLabel>Please specify <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter item name" {...specField} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                          </div>
                        ) : (
                          <FormControl>
                            <Input placeholder="e.g., Student Desk, Smart Board, Locker" {...field} />
                          </FormControl>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {school === 'auditing' && (
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              {...field} 
                              onChange={e => {
                                const val = e.target.value;
                                if (val === "") {
                                  field.onChange(""); // Allow empty string for deletion
                                } else {
                                  const parsed = parseInt(val);
                                  field.onChange(isNaN(parsed) ? "" : parsed);
                                }
                              }} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="assetId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asset ID/Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Asset tag or ID number (if available)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brandModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand/Model</FormLabel>
                        <FormControl>
                          <Input placeholder="Brand and model (if known)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Location Information */}
            <Card>
              <CardHeader>
                <CardTitle>Location Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="building"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Building</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select building" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="kindergarten">Kindergartn</SelectItem>
                            <SelectItem value="primary">Primary</SelectItem>
                            <SelectItem value="middle">Middle School</SelectItem>
                            <SelectItem value="high">High School</SelectItem>
                            <SelectItem value="science_lab">Science Lab</SelectItem>
                            <SelectItem value="it_lab">IT Lab</SelectItem>
                            <SelectItem value="language_room">Language Room</SelectItem>
                            <SelectItem value="islamic_room">Islamic Room</SelectItem>
                            <SelectItem value="music_room">Music Room</SelectItem>
                            <SelectItem value="art_room">Art Room</SelectItem>
                            <SelectItem value="dance_room">Dance Room</SelectItem>
                            <SelectItem value="mph">MPH</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="floor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Floor</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Ground Floor, 1st Floor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade/Class</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Grade 7C, Grade 12A" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="locationNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Location Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional details about the location (optional)"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Condition Assessment */}
            <Card>
              <CardHeader>
                <CardTitle>Condition Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Overall Condition</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-1 md:grid-cols-4 gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="excellent" id="excellent" className="peer sr-only" />
                            <Label
                              htmlFor="excellent"
                              className="cursor-pointer peer-checked:ring-2 peer-checked:ring-green-500 peer-checked:bg-green-50 border-2 border-gray-200 rounded-lg p-4 text-center hover:border-green-400 transition-all flex-1"
                            >
                              <Star className="text-2xl text-green-500 mb-2 mx-auto" />
                              <p className="font-medium text-gray-900">Excellent</p>
                              <p className="text-sm text-gray-500">Like new condition</p>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="good" id="good" className="peer sr-only" />
                            <Label
                              htmlFor="good"
                              className="cursor-pointer peer-checked:ring-2 peer-checked:ring-blue-500 peer-checked:bg-blue-50 border-2 border-gray-200 rounded-lg p-4 text-center hover:border-blue-400 transition-all flex-1"
                            >
                              <ThumbsUp className="text-2xl text-blue-500 mb-2 mx-auto" />
                              <p className="font-medium text-gray-900">Good</p>
                              <p className="text-sm text-gray-500">Working well</p>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="fair" id="fair" className="peer sr-only" />
                            <Label
                              htmlFor="fair"
                              className="cursor-pointer peer-checked:ring-2 peer-checked:ring-yellow-500 peer-checked:bg-yellow-50 border-2 border-gray-200 rounded-lg p-4 text-center hover:border-yellow-400 transition-all flex-1"
                            >
                              <AlertTriangle className="text-2xl text-yellow-500 mb-2 mx-auto" />
                              <p className="font-medium text-gray-900">Fair</p>
                              <p className="text-sm text-gray-500">Minor issues</p>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="poor" id="poor" className="peer sr-only" />
                            <Label
                              htmlFor="poor"
                              className="cursor-pointer peer-checked:ring-2 peer-checked:ring-red-500 peer-checked:bg-red-50 border-2 border-gray-200 rounded-lg p-4 text-center hover:border-red-400 transition-all flex-1"
                            >
                              <XCircle className="text-2xl text-red-500 mb-2 mx-auto" />
                              <p className="font-medium text-gray-900">Poor</p>
                              <p className="text-sm text-gray-500">Needs repair/replacement</p>
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Description <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the current condition, any damage, wear, or issues you've noticed..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low - Cosmetic issues</SelectItem>
                            <SelectItem value="medium">Medium - Minor functionality issues</SelectItem>
                            <SelectItem value="high">High - Major issues affecting use</SelectItem>
                            <SelectItem value="urgent">Urgent - Safety concern or completely unusable</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="safetyConcern"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Safety Concern?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={handleSafetyConcernChange}
                            defaultValue={field.value ? "yes" : "no"}
                            className="flex items-center space-x-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="safety-no" />
                              <Label htmlFor="safety-no">No safety issues</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="safety-yes" />
                              <Label htmlFor="safety-yes">Yes, safety concern</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Photo Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Photo Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Camera className="text-4xl text-gray-400 mb-4 mx-auto" />
                  <p className="text-lg font-medium text-gray-700 mb-2">Add Photos</p>
                  <p className="text-gray-500 mb-4">Upload photos showing the current condition of the asset</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photoUpload"
                  />
                  <Label
                    htmlFor="photoUpload"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-all"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose Files
                  </Label>
                  <p className="text-xs text-gray-400 mt-2">Maximum 5 photos, 10MB each</p>
                </div>

                {/* Photo Preview */}
                {photos.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                          <Camera className="text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-600 mt-1 truncate">{photo.name}</p>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => removePhoto(index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Section */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Submit Audit Report</h3>
                    <p className="text-sm text-gray-500">Review your information before submitting.</p>
                  </div>
                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGoBack}
                      disabled={createAuditMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createAuditMutation.isPending}
                    >
                      {createAuditMutation.isPending ? "Submitting..." : "Submit Audit"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
}

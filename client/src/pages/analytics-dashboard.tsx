import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Zap 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSchool } from "@/hooks/useSchool";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { type User } from "@shared/schema";

interface AnalyticsData {
  auditTrends: Array<{
    date: string;
    count: number;
    pending: number;
    resolved: number;
  }>;
  assetTypeStats: Record<string, number>;
  conditionStats: Record<string, number>;
  priorityStats: Record<string, number>;
  buildingStats: Record<string, number>;
  energyTrends: Array<{
    date: string;
    count: number;
    averageEnergyLevel: number;
  }>;
  summary: {
    totalAudits: number;
    totalEnergyPolls: number;
    averageResponseTime: number;
    safetyIssues: number;
    urgentItems: number;
  };
}

interface EnergyAnalyticsData {
  classStats: Record<string, {
    totalPolls: number;
    totalEnergyLevel: number;
    averageEnergyLevel: number;
    lightsOffCount: number;
    lightsOnCount: number;
  }>;
  energyDistribution: Record<string, number>;
  activityStats: Record<string, {
    count: number;
    totalEnergyLevel: number;
    averageEnergyLevel: number;
  }>;
  summary: {
    totalResponses: number;
    averageEnergyLevel: number;
    uniqueClasses: number;
    estimatedCostSaved: number;
    estimatedCostWasted: number;
  };
}

interface AIInsights {
  summary: string;
  topIssues: string[];
  priorityAreas: string[];
  recommendations: string[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { school } = useSchool();
  const { toast } = useToast();

  // Redirect to login if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "Unauthorized",
        description: "Admin access required for analytics.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  // Fetch analytics overview data
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics/overview", { school }],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Fetch energy analytics data
  const { data: energyAnalytics, isLoading: energyLoading } = useQuery<EnergyAnalyticsData>({
    queryKey: ["/api/analytics/energy", { school }],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // Fetch AI insights
  const { data: aiInsights, isLoading: aiLoading } = useQuery<AIInsights>({
    queryKey: ["/api/analytics/ai-insights", { school }],
    enabled: isAuthenticated && user?.role === 'admin',
  });

  if (isLoading || analyticsLoading || energyLoading || aiLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatAssetTypeData = (stats: Record<string, number>) => {
    return Object.entries(stats).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value,
    }));
  };

  const formatConditionData = (stats: Record<string, number>) => {
    return Object.entries(stats).map(([key, value]) => ({
      condition: key.charAt(0).toUpperCase() + key.slice(1),
      count: value,
    }));
  };

  const formatClassData = (stats: Record<string, { averageEnergyLevel: number; totalPolls: number }>) => {
    return Object.entries(stats).map(([className, data]) => ({
      className,
      averageEnergyLevel: Math.round(data.averageEnergyLevel * 10) / 10,
      totalPolls: data.totalPolls,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="analytics-title">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive insights into school asset management and energy usage
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Audits</p>
                  <p className="text-2xl font-bold" data-testid="total-audits">{analyticsData?.summary.totalAudits || 0}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Safety Issues</p>
                  <p className="text-2xl font-bold text-red-600" data-testid="safety-issues">{analyticsData?.summary.safetyIssues || 0}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Urgent Items</p>
                  <p className="text-2xl font-bold text-orange-600" data-testid="urgent-items">{analyticsData?.summary.urgentItems || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</p>
                  <p className="text-2xl font-bold" data-testid="response-time">{analyticsData?.summary.averageResponseTime || 0} days</p>
                </div>
                <Clock className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Energy Polls</p>
                  <p className="text-2xl font-bold" data-testid="energy-polls">{analyticsData?.summary.totalEnergyPolls || 0}</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">Electricity Saved</p>
                  <p className="text-2xl font-bold text-green-600">${energyAnalytics?.summary.estimatedCostSaved || 0}</p>
                  <p className="text-xs text-green-600">Based on lights off reports</p>
                </div>
                <Lightbulb className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 font-medium">Electricity Wasted</p>
                  <p className="text-2xl font-bold text-red-600">${energyAnalytics?.summary.estimatedCostWasted || 0}</p>
                  <p className="text-xs text-red-600">Potential loss (12 lights/class)</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="audits" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="audits" data-testid="tab-audits">Audit Analytics</TabsTrigger>
            <TabsTrigger value="energy" data-testid="tab-energy">Energy Analytics</TabsTrigger>
            <TabsTrigger value="trends" data-testid="tab-trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="audits" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Asset Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Asset Type Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={formatAssetTypeData(analyticsData?.assetTypeStats || {})}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {formatAssetTypeData(analyticsData?.assetTypeStats || {}).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Condition Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Asset Condition Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={formatConditionData(analyticsData?.conditionStats || {})}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="condition" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Priority Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Priority Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(analyticsData?.priorityStats || {}).map(([priority, count]) => (
                    <div key={priority} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={priority === 'urgent' ? 'destructive' : priority === 'high' ? 'default' : 'secondary'}
                          data-testid={`priority-${priority}`}
                        >
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </Badge>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{count} items</span>
                      </div>
                      <Progress 
                        value={(count / (analyticsData?.summary.totalAudits || 1)) * 100} 
                        className="w-32" 
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Building Usage */}
              <Card>
                <CardHeader>
                  <CardTitle>Building Usage Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(analyticsData?.buildingStats || {}).map(([building, count]) => (
                    <div key={building} className="flex items-center justify-between">
                      <span className="font-medium" data-testid={`building-${building}`}>{building}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{count} audits</span>
                        <Progress 
                          value={(count / (analyticsData?.summary.totalAudits || 1)) * 100} 
                          className="w-32" 
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="energy" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Class Performance */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Class Energy Level Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={formatClassData(energyAnalytics?.classStats || {})}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="className" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="averageEnergyLevel" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Energy Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Energy Level Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={Object.entries(energyAnalytics?.energyDistribution || {}).map(([level, count]) => ({
                      level: `Level ${level}`,
                      count
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="level" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#FFBB28" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Activity Correlation */}
              <Card>
                <CardHeader>
                  <CardTitle>Physical Activity vs Energy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(energyAnalytics?.activityStats || {}).map(([activity, stats]) => (
                    <div key={activity} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize" data-testid={`activity-${activity}`}>{activity}</span>
                        <Badge variant="outline">{stats.count} responses</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Avg Energy:</span>
                        <span className="font-medium">{Math.round(stats.averageEnergyLevel * 10) / 10}/10</span>
                        <Progress value={stats.averageEnergyLevel * 10} className="flex-1" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* AI Insights Section */}
              {aiInsights && (
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-indigo-600" />
                      AI-Powered Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-gray-700 text-sm leading-relaxed">{aiInsights.summary}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2 text-sm">Top Issues</h3>
                        <ul className="space-y-1">
                          {aiInsights.topIssues?.map((issue, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2 text-sm">Priority Areas</h3>
                        <ul className="space-y-1">
                          {aiInsights.priorityAreas?.map((area, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex gap-2">
                              <Clock className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                              <span>{area}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 text-sm">Recommendations</h3>
                      <ul className="space-y-1">
                        {aiInsights.recommendations?.map((rec, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Audit Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Audit Submission Trends (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={analyticsData?.auditTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#0088FE" 
                        strokeWidth={2}
                        name="Total Audits"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="pending" 
                        stroke="#FF8042" 
                        strokeWidth={2}
                        name="Pending"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="resolved" 
                        stroke="#00C49F" 
                        strokeWidth={2}
                        name="Resolved"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Energy Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Energy Poll Trends (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={analyticsData?.energyTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Bar 
                        yAxisId="left"
                        dataKey="count" 
                        fill="#FFBB28" 
                        name="Poll Count"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="averageEnergyLevel" 
                        stroke="#FF8042" 
                        strokeWidth={2}
                        name="Avg Energy Level"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
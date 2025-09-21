import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  RefreshCw,
  Loader2,
  Database,
  Sparkles,
  Target,
  AlertCircle,
  CheckCircle,
  Activity,
  Maximize2,
  Minimize2,
  Users,
  DollarSign,
  Percent,
  Eye
} from 'lucide-react';
import { useEditor } from '@/contexts/EditorContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6'];

interface DashboardPanelProps {
  className?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const DashboardPanel = ({ 
  className = '', 
  isFullscreen = false, 
  onToggleFullscreen = () => {} 
}: DashboardPanelProps) => {
  const { toast } = useToast();
  const { getAllFilesContent } = useEditor();
  const [isGenerating, setIsGenerating] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const generateSmartDashboard = async () => {
    setIsGenerating(true);
    
    try {
      const allFiles = getAllFilesContent();
      const csvFiles = allFiles.filter(file => 
        file.fileName.toLowerCase().endsWith('.csv') && file.content?.trim()
      );

      if (csvFiles.length === 0) {
        toast({
          title: "No CSV Data Found",
          description: "Please upload and open a CSV file to generate dashboard insights.",
          variant: "destructive"
        });
        return;
      }

      const csvFile = csvFiles[0];
      
      const { data, error } = await supabase.functions.invoke('ai-dashboard-insights', {
        body: {
          csvData: csvFile.content.substring(0, 25000), // Increased for more comprehensive analysis
          fileName: csvFile.fileName
        }
      });

      if (error) throw error;

      if (data.success) {
        setDashboardData(data.dashboard);
        toast({
          title: "Smart Dashboard Generated",
          description: `AI-powered dashboard created for ${csvFile.fileName}`,
        });
      } else {
        throw new Error(data.error || 'Failed to generate dashboard');
      }
    } catch (error) {
      console.error('Dashboard generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate smart dashboard",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate dashboard when CSV is detected
  useEffect(() => {
    const allFiles = getAllFilesContent();
    const csvFiles = allFiles.filter(file => 
      file.fileName.toLowerCase().endsWith('.csv') && file.content?.trim()
    );
    
    if (csvFiles.length > 0 && !dashboardData && !isGenerating) {
      generateSmartDashboard();
    }
  }, [getAllFilesContent()]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const renderChart = (chart: any, index: number) => {
    const chartColors = COLORS.slice(0, Math.max(chart.data?.length || 1, 3));
    const height = isFullscreen ? 400 : 300;
    
    switch (chart.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chart.data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey={chart.config?.xKey || 'name'} 
                tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151', 
                  color: '#F3F4F6',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              <Bar dataKey={chart.config?.yKey || 'value'} fill={chartColors[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={chart.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                outerRadius={isFullscreen ? 120 : 80}
                fill="#8884d8"
                dataKey={chart.config?.dataKey || 'value'}
              >
                {chart.data?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151', 
                  color: '#F3F4F6',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ScatterChart data={chart.data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey={chart.config?.xKey || 'x'} 
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                type="number"
              />
              <YAxis 
                dataKey={chart.config?.yKey || 'y'} 
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                type="number"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151', 
                  color: '#F3F4F6',
                  borderRadius: '8px'
                }} 
              />
              <Scatter dataKey={chart.config?.yKey || 'y'} fill={chartColors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chart.data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey={chart.config?.xKey || 'name'} 
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151', 
                  color: '#F3F4F6',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={chart.config?.yKey || 'value'} 
                stroke={chartColors[0]} 
                strokeWidth={3}
                dot={{ fill: chartColors[0], strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      default:
        return <div className="flex items-center justify-center h-64 text-muted-foreground">Unsupported chart type</div>;
    }
  };

  const containerClass = isFullscreen 
    ? "fixed inset-0 z-50 bg-background overflow-y-auto"
    : "h-full bg-panel-background border-panel-border flex flex-col";

  return (
    <div className={`${containerClass} ${className}`}>
      {/* Header */}
      <div className={`p-4 border-b border-panel-border bg-sidebar-background ${isFullscreen ? 'sticky top-0 z-10' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`${isFullscreen ? 'text-2xl' : 'text-lg'} font-bold text-foreground flex items-center gap-2`}>
            <Sparkles className={`${isFullscreen ? 'w-7 h-7' : 'w-5 h-5'}`} />
            AI-Powered Business Dashboard
            {dashboardData && (
              <Badge variant="secondary" className="ml-2">
                {dashboardData.keyMetrics?.[0]?.value} Records
              </Badge>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <Button 
              onClick={generateSmartDashboard}
              disabled={isGenerating}
              size="sm"
              variant="outline"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {isGenerating ? 'Analyzing...' : 'Refresh'}
            </Button>
            <Button 
              onClick={onToggleFullscreen}
              size="sm"
              variant="outline"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Key Metrics Grid */}
        {dashboardData?.keyMetrics && (
          <div className={`grid ${isFullscreen ? 'grid-cols-6' : 'grid-cols-2'} gap-3`}>
            {dashboardData.keyMetrics.map((metric: any, index: number) => (
              <Card key={index} className="bg-card border-border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground font-medium">{metric.label}</p>
                    <p className={`${isFullscreen ? 'text-xl' : 'text-lg'} font-bold text-foreground`}>
                      {metric.value}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {index === 0 && <Users className="w-4 h-4 text-blue-500" />}
                    {index === 1 && <Database className="w-4 h-4 text-green-500" />}
                    {index === 2 && <BarChart3 className="w-4 h-4 text-purple-500" />}
                    {index === 3 && <PieChartIcon className="w-4 h-4 text-orange-500" />}
                    {index === 4 && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                    {index === 5 && <Eye className="w-4 h-4 text-cyan-500" />}
                    {getTrendIcon(metric.trend)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {!dashboardData ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            {isGenerating ? (
              <>
                <Loader2 className="w-20 h-20 text-primary mb-6 animate-spin" />
                <h3 className="text-2xl font-bold text-foreground mb-4">Generating Smart Dashboard</h3>
                <p className="text-lg text-muted-foreground max-w-md">
                  AI is analyzing your data structure, generating visualizations, and creating business insights...
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-muted-foreground">Column Analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse delay-200"></div>
                    <span className="text-sm text-muted-foreground">Chart Generation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse delay-500"></div>
                    <span className="text-sm text-muted-foreground">AI Insights</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Database className="w-20 h-20 text-muted-foreground mb-6" />
                <h3 className="text-2xl font-bold text-foreground mb-4">AI Business Dashboard</h3>
                <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                  Upload a CSV file to generate intelligent visualizations and comprehensive business insights automatically.
                </p>
                <Button onClick={generateSmartDashboard} size="lg" disabled={isGenerating}>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Smart Dashboard
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Charts Grid */}
            <div className={`grid gap-6 ${isFullscreen ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {dashboardData.charts?.map((chart: any, index: number) => (
                <Card key={chart.id || index} className="bg-card border-border shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className={`${isFullscreen ? 'text-xl' : 'text-lg'} flex items-center gap-3`}>
                      {chart.type === 'bar' && <BarChart3 className="w-6 h-6 text-blue-500" />}
                      {chart.type === 'line' && <LineChartIcon className="w-6 h-6 text-green-500" />}
                      {chart.type === 'pie' && <PieChartIcon className="w-6 h-6 text-orange-500" />}
                      {chart.type === 'scatter' && <Target className="w-6 h-6 text-purple-500" />}
                      <span className="font-bold">{chart.title}</span>
                      <Badge variant="outline" className="ml-auto">
                        {chart.data?.length || 0} points
                      </Badge>
                    </CardTitle>
                    {chart.description && (
                      <p className="text-sm text-muted-foreground mt-2">{chart.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="pb-6">
                    {renderChart(chart, index)}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* AI Insights Section */}
            {dashboardData.insights && dashboardData.insights.length > 0 && (
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-4">
                  <CardTitle className={`${isFullscreen ? 'text-xl' : 'text-lg'} flex items-center gap-3`}>
                    <Sparkles className="w-6 h-6 text-yellow-500" />
                    <span className="font-bold">AI Business Intelligence</span>
                    <Badge className="ml-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      {dashboardData.insights.length} Insights
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`grid gap-4 ${isFullscreen ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {dashboardData.insights.slice(0, isFullscreen ? 12 : 8).map((insight: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-white/60 dark:bg-gray-900/60 rounded-lg border border-blue-200 dark:border-blue-800">
                        <Badge variant="secondary" className="mt-0.5 min-w-[32px] text-center font-bold">
                          {index + 1}
                        </Badge>
                        <p className="text-sm text-gray-700 dark:text-gray-300 flex-1 leading-relaxed">
                          {insight}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  {dashboardData.insights.length > (isFullscreen ? 12 : 8) && (
                    <div className="mt-4 text-center">
                      <Badge variant="outline">
                        +{dashboardData.insights.length - (isFullscreen ? 12 : 8)} more insights available
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Business Value Summary */}
            {dashboardData.businessValue && (
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className={`${isFullscreen ? 'text-xl' : 'text-lg'} flex items-center gap-3`}>
                    <DollarSign className="w-6 h-6 text-green-500" />
                    <span className="font-bold">Business Value Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {dashboardData.businessValue}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
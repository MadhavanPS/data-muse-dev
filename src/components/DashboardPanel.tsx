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
  Scatter
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
  Activity
} from 'lucide-react';
import { useEditor } from '@/contexts/EditorContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export const DashboardPanel = () => {
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

      const csvFile = csvFiles[0]; // Use first CSV file
      
      const { data, error } = await supabase.functions.invoke('ai-dashboard-insights', {
        body: {
          csvData: csvFile.content.substring(0, 15000), // Limit for performance
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
    
    if (csvFiles.length > 0 && !dashboardData) {
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

  const renderChart = (chart: any) => {
    const chartColors = COLORS.slice(0, chart.data?.length || 1);
    
    switch (chart.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey={chart.config?.xKey || 'name'} 
                tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F3F4F6' }} />
              <Bar dataKey={chart.config?.yKey || 'value'} fill={chartColors[0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chart.data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey={chart.config?.dataKey || 'value'}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
              >
                {chart.data?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F3F4F6' }} />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey={chart.config?.xKey || 'x'} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <YAxis dataKey={chart.config?.yKey || 'y'} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F3F4F6' }} />
              <Scatter dataKey={chart.config?.yKey || 'y'} fill={chartColors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey={chart.config?.xKey || 'name'} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F3F4F6' }} />
              <Line type="monotone" dataKey={chart.config?.yKey || 'value'} stroke={chartColors[0]} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      
      default:
        return <div className="flex items-center justify-center h-64 text-muted-foreground">Unsupported chart type</div>;
    }
  };

  return (
    <div className="h-full bg-panel-background border-panel-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-panel-border bg-sidebar-background">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Smart Dashboard
          </h2>
          <Button 
            onClick={generateSmartDashboard}
            disabled={isGenerating}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {isGenerating ? 'Generating...' : 'Regenerate'}
          </Button>
        </div>
        
        {/* Quick Stats */}
        {dashboardData?.keyMetrics && (
          <div className="grid grid-cols-2 gap-2">
            {dashboardData.keyMetrics.slice(0, 4).map((metric: any, index: number) => (
              <Card key={index} className="bg-card border-border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                    <p className="text-lg font-semibold text-foreground">{metric.value}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(metric.trend)}
                    {metric.change && (
                      <span className={`text-xs ${
                        metric.trend === 'up' ? 'text-green-500' : 
                        metric.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                      }`}>
                        {metric.change}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {!dashboardData ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            {isGenerating ? (
              <>
                <Loader2 className="w-16 h-16 text-primary mb-4 animate-spin" />
                <h3 className="text-lg font-medium text-foreground mb-2">Generating Smart Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                  AI is analyzing your data and creating visualizations...
                </p>
              </>
            ) : (
              <>
                <Database className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Dashboard Data</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                  Upload a CSV file to generate intelligent visualizations and business insights automatically.
                </p>
                <Button onClick={generateSmartDashboard} disabled={isGenerating}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Smart Dashboard
                </Button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Charts Grid */}
            <div className="grid gap-4">
              {dashboardData.charts?.map((chart: any, index: number) => (
                <Card key={chart.id || index} className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      {chart.type === 'bar' && <BarChart3 className="w-5 h-5 text-primary" />}
                      {chart.type === 'line' && <LineChartIcon className="w-5 h-5 text-primary" />}
                      {chart.type === 'pie' && <PieChartIcon className="w-5 h-5 text-primary" />}
                      {chart.type === 'scatter' && <Target className="w-5 h-5 text-primary" />}
                      {chart.title}
                    </CardTitle>
                    {chart.description && (
                      <p className="text-sm text-muted-foreground">{chart.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {renderChart(chart)}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Extended Metrics */}
            {dashboardData.keyMetrics && dashboardData.keyMetrics.length > 4 && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Additional Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {dashboardData.keyMetrics.slice(4).map((metric: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm font-medium">{metric.label}</span>
                        <span className="text-sm text-muted-foreground">{metric.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Insights Section */}
            {dashboardData.insights && dashboardData.insights.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    AI-Generated Business Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardData.insights.slice(0, 8).map((insight: string, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <Badge variant="secondary" className="mt-0.5 min-w-[24px] text-center">{index + 1}</Badge>
                        <p className="text-sm text-muted-foreground flex-1">{insight}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};
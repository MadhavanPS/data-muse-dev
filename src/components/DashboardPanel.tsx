import React, { useState, useEffect } from 'react';
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

  // Render matplotlib/seaborn style charts without recharts conversion
  const renderMatplotlibChart = (chart: any, index: number) => {
    const height = isFullscreen ? 400 : 300;
    
    return (
      <div className="bg-white p-4 border" style={{ height: `${height}px` }}>
        <div className="h-full flex flex-col">
          {/* Chart Title - matplotlib style */}
          <div className="text-center mb-2">
            <h3 className="text-sm font-medium text-gray-800">
              {chart.title}
            </h3>
          </div>
          
          {/* Chart Content Area */}
          <div className="flex-1 flex items-center justify-center bg-gray-50 border">
            <div className="text-center p-4">
              <div className="text-xs text-gray-600 mb-2">
                <strong>Chart Type:</strong> {chart.pythonEquivalent || chart.type}
              </div>
              
              {/* Display chart data in matplotlib style */}
              {chart.type === 'heatmap' ? (
                <div className="grid gap-1 text-xs" style={{ 
                  gridTemplateColumns: `repeat(${Math.min(chart.data?.length || 1, 8)}, 1fr)`,
                  maxWidth: '300px'
                }}>
                  {chart.data?.slice(0, 64).map((item: any, idx: number) => {
                    const value = typeof item.value === 'number' ? item.value : 0;
                    const intensity = Math.abs(value);
                    return (
                      <div 
                        key={idx}
                        className="w-6 h-6 flex items-center justify-center text-white text-xs border"
                        style={{
                          backgroundColor: value >= 0 
                            ? `rgb(${Math.floor(255 - intensity * 200)}, ${Math.floor(255 - intensity * 100)}, 255)` 
                            : `rgb(255, ${Math.floor(255 - intensity * 100)}, ${Math.floor(255 - intensity * 200)})`,
                          color: intensity > 0.5 ? '#fff' : '#000'
                        }}
                        title={`${item.x} vs ${item.y}: ${value.toFixed(3)}`}
                      >
                        {value.toFixed(1)}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">
                    <strong>Data Points:</strong> {chart.data?.length || 0}
                  </div>
                  
                  {/* Show sample data */}
                  {chart.data?.slice(0, 5).map((item: any, idx: number) => (
                    <div key={idx} className="text-xs text-gray-700 bg-gray-100 p-1 rounded">
                      {Object.entries(item).map(([key, value]) => (
                        <span key={key} className="mr-2">
                          {key}: {typeof value === 'number' ? value.toFixed(2) : String(value)}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              
              {chart.description && (
                <div className="text-xs text-gray-500 mt-2 italic">
                  {chart.description}
                </div>
              )}
            </div>
          </div>
          
          {/* Axis labels - matplotlib style */}
          {chart.config?.xKey && (
            <div className="text-center mt-1">
              <span className="text-xs text-gray-700">{chart.config.xKey}</span>
            </div>
          )}
        </div>
      </div>
    );
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
      <div className="flex-1 p-4 overflow-y-auto max-h-full">
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
            {/* Chart Categories - Python Analysis Overview */}
            {dashboardData.charts && dashboardData.charts.length > 0 && (
              <div className="grid gap-4 mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Python-Style Analysis Overview
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                  {[
                    { category: 'univariate', label: 'Univariate', icon: '📊', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
                    { category: 'bivariate', label: 'Bivariate', icon: '📈', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
                    { category: 'correlation', label: 'Correlation', icon: '🔗', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
                    { category: 'pairwise', label: 'Pairwise', icon: '🎯', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
                    { category: 'categorical', label: 'Categorical', icon: '🥧', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
                    { category: 'timeseries', label: 'Time Series', icon: '⏱️', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' }
                  ].map(cat => {
                    const count = dashboardData.charts.filter((c: any) => c.category === cat.category).length;
                    return count > 0 ? (
                      <Badge key={cat.category} className={`${cat.color} justify-center py-2`}>
                        {cat.icon} {cat.label}: {count}
                      </Badge>
                    ) : null;
                  })}
                </div>
                <div className="text-sm text-muted-foreground">
                  Generated {dashboardData.charts.length} total charts using matplotlib/seaborn equivalent analysis
                </div>
              </div>
            )}

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
                      {chart.type === 'heatmap' && <Activity className="w-6 h-6 text-red-500" />}
                      {chart.type === 'boxplot' && <AlertCircle className="w-6 h-6 text-yellow-500" />}
                      <span className="font-bold">{chart.title}</span>
                      <div className="ml-auto flex items-center gap-2">
                        <Badge variant="outline">
                          {chart.data?.length || 0} points
                        </Badge>
                        {chart.category && (
                          <Badge variant="secondary" className="text-xs">
                            {chart.category}
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                    {chart.description && (
                      <p className="text-sm text-muted-foreground mt-2">{chart.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="pb-6">
                    {renderMatplotlibChart(chart, index)}
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
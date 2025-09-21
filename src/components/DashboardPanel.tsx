import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  AlertCircle,
  CheckCircle,
  BarChart3,
  LineChart,
  PieChart,
  Brain,
  Sparkles,
  Target,
  Lightbulb,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEditor } from '@/contexts/EditorContext';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Cell,
  AreaChart,
  Area
} from 'recharts';

interface DashboardPanelProps {
  className?: string;
}

export const DashboardPanel = ({ className = '' }: DashboardPanelProps) => {
  const { getAllFilesContent } = useEditor();
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [templateRecommendations, setTemplateRecommendations] = useState<any>(null);
  const [aiKPIs, setAiKPIs] = useState<any>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Get CSV data for dashboard
  const getCsvData = () => {
    const allFiles = getAllFilesContent();
    const csvFiles = allFiles.filter(f => f.type === 'csv');
    return csvFiles.length > 0 ? csvFiles[csvFiles.length - 1] : null;
  };

  const currentCsvData = getCsvData();

  // Process CSV data for visualizations
  const processDataForCharts = () => {
    if (!currentCsvData?.content) {
      return {
        barData: [],
        lineData: [],
        pieData: [],
        kpis: {
          totalRecords: 0,
          avgValue: 0,
          maxValue: 0,
          completionRate: 0
        }
      };
    }

    try {
      const lines = currentCsvData.content.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const dataRows = lines.slice(1).map(line => 
        line.split(',').map(cell => cell.trim())
      );

      // Create sample visualizations based on data
      const processedData = dataRows.map((row, index) => {
        const obj: any = { id: index };
        headers.forEach((header, i) => {
          const value = row[i];
          // Try to parse as number, otherwise keep as string
          const numValue = parseFloat(value);
          obj[header] = isNaN(numValue) ? value : numValue;
        });
        return obj;
      });

      // Calculate KPIs
      const numericColumns = headers.filter(header => 
        processedData.some(row => typeof row[header] === 'number')
      );

      let totalRecords = processedData.length;
      let avgValue = 0;
      let maxValue = 0;
      let completionRate = 0;

      if (numericColumns.length > 0) {
        const firstNumericCol = numericColumns[0];
        const values = processedData.map(row => row[firstNumericCol]).filter(v => typeof v === 'number');
        avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
        maxValue = Math.max(...values);
        completionRate = (values.length / totalRecords) * 100;
      }

      // Create chart data
      const chartData = processedData.slice(0, 10); // Limit for better visualization

      return {
        barData: chartData,
        lineData: chartData,
        pieData: chartData.slice(0, 5),
        kpis: {
          totalRecords,
          avgValue: Math.round(avgValue * 100) / 100,
          maxValue,
          completionRate: Math.round(completionRate)
        },
        headers,
        numericColumns
      };
    } catch (error) {
      console.error('Error processing CSV data:', error);
      return {
        barData: [],
        lineData: [],
        pieData: [],
        kpis: {
          totalRecords: 0,
          avgValue: 0,
          maxValue: 0,
          completionRate: 0
        }
      };
    }
  };

  const { barData, lineData, pieData, kpis, headers = [], numericColumns = [] } = processDataForCharts();

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  // AI Analysis Functions
  const getAIInsights = async () => {
    if (!currentCsvData?.content) return;
    
    setIsLoadingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-dashboard-insights', {
        body: { 
          csvData: currentCsvData.content,
          analysisType: 'insights'
        }
      });

      if (error) throw error;
      setAiInsights(data.analysis);
    } catch (error) {
      console.error('Error getting AI insights:', error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const getTemplateRecommendations = async () => {
    if (!currentCsvData?.content) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-dashboard-insights', {
        body: { 
          csvData: currentCsvData.content,
          analysisType: 'templates'
        }
      });

      if (error) throw error;
      setTemplateRecommendations(data.analysis);
    } catch (error) {
      console.error('Error getting template recommendations:', error);
    }
  };

  const getAIKPIs = async () => {
    if (!currentCsvData?.content) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-dashboard-insights', {
        body: { 
          csvData: currentCsvData.content,
          analysisType: 'kpis'
        }
      });

      if (error) throw error;
      setAiKPIs(data.analysis);
    } catch (error) {
      console.error('Error getting AI KPIs:', error);
    }
  };

  // Load AI insights when CSV data changes
  useEffect(() => {
    if (currentCsvData?.content) {
      getAIInsights();
      getTemplateRecommendations();
      getAIKPIs();
    }
  }, [currentCsvData?.content]);

  return (
    <div className={`h-full bg-panel-background border-r border-panel-border overflow-y-auto ${className}`}>
      {/* Dashboard Header */}
      <div className="p-4 border-b border-panel-border bg-panel-header">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Data Dashboard</h2>
        </div>
        {currentCsvData && (
          <p className="text-sm text-muted-foreground mt-1">
            Analysis of: {currentCsvData.fileName}
          </p>
        )}
      </div>

      {!currentCsvData ? (
        <div className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Data Available</h3>
          <p className="text-muted-foreground">
            Upload or create a CSV file to view dashboard insights.
          </p>
        </div>
      ) : (
        <div className="p-4 space-y-6">
          {/* AI Template Recommendations */}
          {templateRecommendations && (
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardHeader className="p-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-medium text-card-foreground">AI Dashboard Recommendations</CardTitle>
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                {templateRecommendations.templates?.slice(0, 3).map((template: any, index: number) => (
                  <div key={index} className="p-3 bg-card rounded-lg border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-card-foreground">{template.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {template.suitabilityScore}% match
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {template.features?.slice(0, 3).map((feature: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* AI-Suggested KPIs Section */}
          {aiKPIs && (
            <Card className="bg-card">
              <CardHeader className="p-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-medium text-card-foreground">AI-Suggested KPIs</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-2 gap-3">
                  {aiKPIs.kpis?.slice(0, 4).map((kpi: any, index: number) => (
                    <div key={index} className="p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="w-3 h-3 text-primary" />
                        <h5 className="text-xs font-medium text-card-foreground">{kpi.name}</h5>
                      </div>
                      <p className="text-xs text-muted-foreground">{kpi.description}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {kpi.category}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Traditional KPIs Section */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card">
              <CardHeader className="p-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-card-foreground">Total Records</CardTitle>
                  <Users className="w-4 h-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-xl font-bold text-card-foreground">{kpis.totalRecords}</div>
                <p className="text-xs text-muted-foreground">Data points</p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="p-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-card-foreground">Completion Rate</CardTitle>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-xl font-bold text-card-foreground">{kpis.completionRate}%</div>
                <p className="text-xs text-muted-foreground">Data quality</p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="p-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-card-foreground">Average Value</CardTitle>
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-xl font-bold text-card-foreground">{kpis.avgValue}</div>
                <p className="text-xs text-muted-foreground">Mean calculation</p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="p-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-card-foreground">Max Value</CardTitle>
                  <Activity className="w-4 h-4 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-xl font-bold text-card-foreground">{kpis.maxValue}</div>
                <p className="text-xs text-muted-foreground">Peak value</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="space-y-4">
            {/* Bar Chart */}
            <Card className="bg-card">
              <CardHeader className="p-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-medium text-card-foreground">Distribution Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                      <XAxis 
                        dataKey={headers[0]} 
                        tick={{ fontSize: 12 }}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                      {numericColumns.slice(0, 2).map((col, index) => (
                        <Bar 
                          key={col}
                          dataKey={col} 
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Line Chart */}
            <Card className="bg-card">
              <CardHeader className="p-3">
                <div className="flex items-center gap-2">
                  <LineChart className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-medium text-card-foreground">Trend Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={lineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                      <XAxis 
                        dataKey={headers[0]} 
                        tick={{ fontSize: 12 }}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                      {numericColumns.slice(0, 2).map((col, index) => (
                        <Line 
                          key={col}
                          type="monotone" 
                          dataKey={col} 
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                        />
                      ))}
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Area Chart */}
            <Card className="bg-card">
              <CardHeader className="p-3">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-medium text-card-foreground">Area Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={lineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                      <XAxis 
                        dataKey={headers[0]} 
                        tick={{ fontSize: 12 }}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                      {numericColumns.slice(0, 1).map((col, index) => (
                        <Area 
                          key={col}
                          type="monotone" 
                          dataKey={col} 
                          stroke={COLORS[index % COLORS.length]}
                          fill={COLORS[index % COLORS.length]}
                          fillOpacity={0.6}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights Section */}
          {aiInsights ? (
            <Card className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200/50 dark:border-blue-800/50">
              <CardHeader className="p-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-medium text-card-foreground">AI-Powered Insights</CardTitle>
                  {isLoadingAI && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-4">
                {/* Data Quality */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-card-foreground">Data Quality Score</h4>
                    <Badge variant={aiInsights.insights.dataQuality.score > 80 ? "default" : "secondary"}>
                      {aiInsights.insights.dataQuality.score}/100
                    </Badge>
                  </div>
                  {aiInsights.insights.dataQuality.recommendations?.length > 0 && (
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {aiInsights.insights.dataQuality.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                        <li key={idx}>• {rec}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Column Analysis */}
                {aiInsights.insights.columnAnalysis?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-card-foreground">Column Insights</h4>
                    <div className="space-y-2">
                      {aiInsights.insights.columnAnalysis.slice(0, 3).map((col: any, idx: number) => (
                        <div key={idx} className="p-2 bg-muted/30 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">{col.column}</Badge>
                            <Badge variant="secondary" className="text-xs">{col.dataType}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{col.insights}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Business Insights */}
                {aiInsights.insights.businessInsights?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-card-foreground">Business Insights</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {aiInsights.insights.businessInsights.slice(0, 4).map((insight: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <TrendingUp className="w-3 h-3 mt-0.5 text-primary flex-shrink-0" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actionable Recommendations */}
                {aiInsights.insights.actionableRecommendations?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-card-foreground">AI Recommendations</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {aiInsights.insights.actionableRecommendations.slice(0, 3).map((rec: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button 
                  onClick={getAIInsights} 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3"
                  disabled={isLoadingAI}
                >
                  {isLoadingAI ? 'Analyzing...' : 'Refresh AI Analysis'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card">
              <CardHeader className="p-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-medium text-card-foreground">Data Insights</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-card-foreground">Dataset Overview</h4>
                  <p className="text-xs text-muted-foreground">
                    This dataset contains {kpis.totalRecords} records with {headers.length} columns. 
                    {numericColumns.length > 0 && (
                      ` ${numericColumns.length} columns contain numeric data suitable for statistical analysis.`
                    )}
                  </p>
                </div>
                
                <Button 
                  onClick={getAIInsights} 
                  variant="default" 
                  size="sm" 
                  className="w-full"
                  disabled={isLoadingAI}
                >
                  <Brain className="w-4 h-4 mr-2" />
                  {isLoadingAI ? 'Getting AI Insights...' : 'Get AI Insights'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

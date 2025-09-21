import React from 'react';
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
  PieChart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEditor } from '@/contexts/EditorContext';
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
          {/* KPIs Section */}
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

          {/* Insights Section */}
          <Card className="bg-card">
            <CardHeader className="p-3">
              <CardTitle className="text-sm font-medium text-card-foreground">Data Insights</CardTitle>
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
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-card-foreground">Key Findings</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Data completion rate is {kpis.completionRate}%</li>
                  {numericColumns.length > 0 && (
                    <>
                      <li>• Average value across numeric fields: {kpis.avgValue}</li>
                      <li>• Maximum recorded value: {kpis.maxValue}</li>
                    </>
                  )}
                  <li>• Dataset structure appears {kpis.completionRate > 80 ? 'well-organized' : 'needs cleaning'}</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-card-foreground">Recommendations</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {kpis.completionRate < 90 && (
                    <li>• Consider data cleaning to improve completion rate</li>
                  )}
                  {numericColumns.length > 2 && (
                    <li>• Multiple numeric fields available for correlation analysis</li>
                  )}
                  <li>• Dataset is suitable for further statistical modeling</li>
                  <li>• Consider creating additional derived metrics from existing data</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

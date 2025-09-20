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
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon,
  Sparkles,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChartData {
  chartType: 'bar' | 'line' | 'pie';
  data: any[];
  config: {
    title: string;
    xKey?: string;
    yKey?: string;
    [key: string]: any;
  };
  insights?: string;
}

interface DataVisualizationProps {
  csvData?: string;
  fileName?: string;
}

const COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];

export const DataVisualization = ({ csvData, fileName }: DataVisualizationProps) => {
  const { toast } = useToast();
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  
  const chartTypes = [
    { id: 'bar' as const, icon: BarChart3, label: 'Bar Chart' },
    { id: 'line' as const, icon: LineChartIcon, label: 'Line Chart' },
    { id: 'pie' as const, icon: PieChartIcon, label: 'Pie Chart' },
  ];
  
  const generateVisualization = async () => {
    if (!csvData || !prompt.trim()) {
      toast({
        title: "Missing Data",
        description: "Please provide both CSV data and a visualization prompt",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-data-viz', {
        body: {
          csvData: csvData.substring(0, 2000), // Send first 2000 chars to avoid token limits
          prompt,
          chartType: selectedChartType
        }
      });
      
      if (error) throw error;
      
      if (data.success && data.visualization) {
        setChartData(data.visualization);
        toast({
          title: "Visualization Generated",
          description: "Your chart has been created successfully!"
        });
      } else {
        throw new Error(data.error || 'Failed to generate visualization');
      }
    } catch (error) {
      console.error('Visualization error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate visualization",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const renderChart = () => {
    if (!chartData || !chartData.data || chartData.data.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No Visualization</p>
            <p className="text-sm">Generate a chart from your CSV data</p>
          </div>
        </div>
      );
    }
    
    const { chartType, data, config } = chartData;
    
    switch (chartType) {
      case 'bar':
        return (
          <div className="bg-white p-4 border border-gray-300">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="1 1" stroke="#cccccc" />
                <XAxis 
                  dataKey={config?.xKey || 'name'} 
                  tick={{ fill: '#000000', fontSize: 12 }}
                  axisLine={{ stroke: '#000000' }}
                  tickLine={{ stroke: '#000000' }}
                />
                <YAxis 
                  tick={{ fill: '#000000', fontSize: 12 }}
                  axisLine={{ stroke: '#000000' }}
                  tickLine={{ stroke: '#000000' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #cccccc',
                    borderRadius: '0px',
                    fontSize: '12px',
                    color: '#000000'
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px', color: '#000000' }}
                />
                <Bar dataKey={config?.yKey || 'value'} fill="#1f77b4" stroke="#000000" strokeWidth={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
        
      case 'line':
        return (
          <div className="bg-white p-4 border border-gray-300">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="1 1" stroke="#cccccc" />
                <XAxis 
                  dataKey={config?.xKey || 'name'} 
                  tick={{ fill: '#000000', fontSize: 12 }}
                  axisLine={{ stroke: '#000000' }}
                  tickLine={{ stroke: '#000000' }}
                />
                <YAxis 
                  tick={{ fill: '#000000', fontSize: 12 }}
                  axisLine={{ stroke: '#000000' }}
                  tickLine={{ stroke: '#000000' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #cccccc',
                    borderRadius: '0px',
                    fontSize: '12px',
                    color: '#000000'
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px', color: '#000000' }}
                />
                <Line 
                  type="monotone" 
                  dataKey={config?.yKey || 'value'} 
                  stroke="#1f77b4" 
                  strokeWidth={2}
                  dot={{ fill: '#1f77b4', strokeWidth: 1, stroke: '#000000', r: 3 }}
                  activeDot={{ r: 5, fill: '#1f77b4', stroke: '#000000' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
        
      case 'pie':
        return (
          <div className="bg-white p-4 border border-gray-300">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#1f77b4"
                  dataKey={config?.yKey || 'value'}
                  stroke="#000000"
                  strokeWidth={0.5}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#000000" strokeWidth={0.5} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #cccccc',
                    borderRadius: '0px',
                    fontSize: '12px',
                    color: '#000000'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Chart Type Selector */}
      <div className="flex items-center gap-2">
        {chartTypes.map((chart) => {
          const Icon = chart.icon;
          return (
            <Button
              key={chart.id}
              variant={selectedChartType === chart.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedChartType(chart.id)}
              className="flex items-center gap-2 bg-white border border-gray-400 text-black hover:bg-gray-100 rounded-none transition-none"
            >
              <Icon className="w-4 h-4" />
              {chart.label}
            </Button>
          );
        })}
      </div>
      
      {/* Prompt Input */}
      <div className="space-y-2">
        <Textarea
          placeholder="Describe what you want to visualize (e.g., 'Show sales by month as a bar chart')"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[80px]"
        />
        <Button 
          onClick={generateVisualization}
          disabled={isGenerating || !csvData || !prompt.trim()}
          className="w-full bg-white border border-gray-400 text-black hover:bg-gray-100 rounded-none transition-none"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          {isGenerating ? 'Generating...' : 'Generate Visualization'}
        </Button>
      </div>
      
      {/* Chart Display */}
      <Card className="flex-1 min-h-0 bg-white border border-gray-400 rounded-none shadow-none">
        <CardHeader className="pb-2 border-b border-gray-300">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-black font-medium">
              {chartData?.config?.title || 'Data Visualization'}
            </CardTitle>
            {fileName && (
              <span className="text-sm text-gray-600">
                Data: {fileName}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 bg-gray-50">
          {renderChart()}
        </CardContent>
      </Card>
      
      {/* Insights */}
      {chartData?.insights && (
        <Card className="bg-white border border-gray-400 rounded-none shadow-none">
          <CardHeader className="pb-2 border-b border-gray-300">
            <CardTitle className="text-base text-black font-medium">Insights</CardTitle>
          </CardHeader>
          <CardContent className="bg-gray-50">
            <p className="text-sm text-gray-700">{chartData.insights}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
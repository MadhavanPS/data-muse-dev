import React, { useState } from 'react';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp,
  Clock,
  RefreshCw,
  Download,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useEditor } from '@/contexts/EditorContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DataVisualization } from '@/components/DataVisualization';

interface DataVisualizationTabProps {
  className?: string;
}

export const DataVisualizationTab = ({ className = '' }: DataVisualizationTabProps) => {
  const [activeTab, setActiveTab] = useState('visualization');
  const [selectedChart, setSelectedChart] = useState('bar');
  const { toast } = useToast();
  const { fileContents, getAllFilesContent } = useEditor();
  
  const chartTypes = [
    { id: 'bar', icon: BarChart3, label: 'Bar Chart' },
    { id: 'line', icon: LineChart, label: 'Line Chart' },
    { id: 'pie', icon: PieChart, label: 'Pie Chart' },
    { id: 'trend', icon: TrendingUp, label: 'Trend' },
    { id: 'time', icon: Clock, label: 'Time Series' },
    { id: 'refresh', icon: RefreshCw, label: 'Refresh' },
    { id: 'download', icon: Download, label: 'Download' },
    { id: 'ai', icon: Sparkles, label: 'AI Suggest' },
  ];

  // Get CSV data from current files
  const getCsvData = () => {
    const allFiles = getAllFilesContent();
    
    // Find CSV files
    const csvFiles = Object.entries(allFiles).filter(([filename, fileData]) => 
      filename.toLowerCase().endsWith('.csv')
    );
    
    if (csvFiles.length > 0) {
      const [filename, fileData] = csvFiles[0];
      // Handle different file data structures
      const content = typeof fileData === 'string' ? fileData : fileData?.content || '';
      return {
        content,
        filename
      };
    }
    
    return null;
  };

  return (
    <div className={`bg-panel-background border-panel-border h-full flex flex-col ${className}`}>
      {/* Header Tabs */}
      <div className="flex border-b border-panel-border bg-sidebar-background">
        <button
          className={`px-4 py-2 text-sm font-medium border-r border-panel-border ${
            activeTab === 'explorer' 
              ? 'bg-sidebar-active text-foreground' 
              : 'text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent'
          }`}
          onClick={() => setActiveTab('explorer')}
        >
          File Explorer
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'visualization' 
              ? 'bg-sidebar-active text-foreground' 
              : 'text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent'
          }`}
          onClick={() => setActiveTab('visualization')}
        >
          Data Visualization
        </button>
      </div>

      {/* Chart Type Buttons - First Row */}
      <div className="p-3 border-b border-panel-border">
        <div className="grid grid-cols-4 gap-2 mb-3">
          {chartTypes.slice(0, 4).map((chart) => {
            const Icon = chart.icon;
            return (
              <Button
                key={chart.id}
                variant="outline"
                size="sm"
                className={`h-10 text-xs flex-col gap-1 ${
                  selectedChart === chart.id 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-card hover:bg-accent'
                }`}
                onClick={() => setSelectedChart(chart.id)}
                title={chart.label}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px]">{chart.label}</span>
              </Button>
            );
          })}
        </div>
        
        {/* Action Buttons - Second Row */}
        <div className="flex gap-4">
          {chartTypes.slice(4).map((chart) => {
            const Icon = chart.icon;
            const label = chart.id === 'time' ? 'Time Series' : 
                         chart.id === 'ai' ? 'AI Sugg' : chart.label;
            return (
              <button
                key={chart.id}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
                onClick={() => {
                  if (chart.id === 'refresh') {
                    // Handle refresh
                  } else if (chart.id === 'download') {
                    // Handle download
                  } else if (chart.id === 'ai') {
                    // Handle AI suggestions
                  }
                }}
                title={chart.label}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Visualization Area */}
      <div className="flex-1 p-4">
        {(() => {
          const csvData = getCsvData();
          
          if (!csvData) {
            return (
              <Card className="h-full bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Data Visualization</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2 text-foreground">No CSV Data</h3>
                    <p className="text-sm text-muted-foreground">
                      Open a CSV file to generate visualizations
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          }
          
          return (
            <DataVisualization 
              csvData={csvData.content}
              fileName={csvData.filename}
            />
          );
        })()}
      </div>
    </div>
  );
};
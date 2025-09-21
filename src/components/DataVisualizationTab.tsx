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
import { useEditor } from '@/contexts/EditorContext';
import { DataVisualization } from '@/components/DataVisualization';

interface DataVisualizationTabProps {
  className?: string;
}

export const DataVisualizationTab = ({ className = '' }: DataVisualizationTabProps) => {
  const [activeTab, setActiveTab] = useState('visualization');
  const [selectedChart, setSelectedChart] = useState('bar');
  const { fileContents, getAllFilesContent } = useEditor();
  
  const chartTypes = [
    { id: 'bar', icon: BarChart3, label: 'Bar Chart' },
    { id: 'line', icon: LineChart, label: 'Line Chart' },
    { id: 'pie', icon: PieChart, label: 'Pie Chart' },
    { id: 'trend', icon: TrendingUp, label: 'Trend' },
  ];

  // Get CSV data from currently open tabs (EditorContext)
  const getCsvData = () => {
    const allFiles = getAllFilesContent(); // [{ fileName, content, type }]
    const csv = allFiles.find(f => f.fileName.toLowerCase().endsWith('.csv') && (f.content?.trim()?.length || 0) > 0);
    return csv ? { content: csv.content, filename: csv.fileName } : null;
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

      {/* Chart Type Buttons */}
      <div className="p-3 border-b border-panel-border">
        <div className="grid grid-cols-4 gap-2">
          {chartTypes.map((chart) => {
            const Icon = chart.icon;
            return (
              <Button
                key={chart.id}
                variant="outline"
                size="sm"
                className={`h-12 text-xs flex-col gap-1 transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                  selectedChart === chart.id 
                    ? 'bg-primary text-primary-foreground border-primary scale-105 shadow-md' 
                    : 'bg-card hover:bg-accent border-border'
                }`}
                onClick={() => setSelectedChart(chart.id)}
                title={chart.label}
              >
                <Icon className={`w-4 h-4 transition-transform duration-200 ${
                  selectedChart === chart.id ? 'scale-110' : 'hover:scale-110'
                }`} />
                <span className="text-[10px]">{chart.label}</span>
              </Button>
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
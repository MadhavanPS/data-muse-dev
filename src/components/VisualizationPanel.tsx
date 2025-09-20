import React, { useState } from 'react';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Maximize2, 
  RefreshCw, 
  Download,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VisualizationPanelProps {
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const VisualizationPanel = ({ isFullscreen = false, onToggleFullscreen }: VisualizationPanelProps) => {
  const [activeChart, setActiveChart] = useState('bar');

  const chartTypes = [
    { id: 'bar', icon: BarChart3, label: 'Bar Chart' },
    { id: 'line', icon: LineChart, label: 'Line Chart' },
    { id: 'pie', icon: PieChart, label: 'Pie Chart' },
  ];

  const MockChart = () => (
    <div className="w-full h-full bg-viz-background rounded-lg border border-viz-border flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">No Visualization Active</p>
        <p className="text-sm">
          Use the AI assistant to generate charts from your data
        </p>
      </div>
    </div>
  );

  return (
    <Card className={`bg-viz-background border-viz-border ${
      isFullscreen ? 'fixed inset-0 z-50' : 'h-full'
    }`}>
      <CardHeader className="bg-viz-header border-b border-viz-border p-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Data Visualization
          </CardTitle>
          
          <div className="flex items-center gap-1">
            {/* Chart Type Selector */}
            <div className="flex items-center gap-1 mr-2">
              {chartTypes.map((chart) => {
                const Icon = chart.icon;
                return (
                  <Button
                    key={chart.id}
                    variant="ghost"
                    size="sm"
                    className={`w-8 h-8 p-0 ${
                      activeChart === chart.id ? 'bg-primary text-primary-foreground' : ''
                    }`}
                    onClick={() => setActiveChart(chart.id)}
                    title={chart.label}
                  >
                    <Icon className="w-4 h-4" />
                  </Button>
                );
              })}
            </div>

            {/* Actions */}
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0" title="Download">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0" title="Settings">
              <Settings className="w-4 h-4" />
            </Button>
            {onToggleFullscreen && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-8 h-8 p-0" 
                onClick={onToggleFullscreen}
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 h-full">
        <MockChart />
      </CardContent>
    </Card>
  );
};
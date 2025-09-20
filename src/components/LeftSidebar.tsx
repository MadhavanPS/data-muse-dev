import React from 'react';
import { 
  Files, 
  Search, 
  Database, 
  BarChart3, 
  Settings, 
  GitBranch, 
  Terminal,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LeftSidebarProps {
  activePanel: string;
  onPanelChange: (panel: string) => void;
}

export const LeftSidebar = ({ activePanel, onPanelChange }: LeftSidebarProps) => {
  const sidebarItems = [
    { id: 'explorer', icon: Files, label: 'Explorer', tooltip: 'File Explorer' },
    { id: 'search', icon: Search, label: 'Search', tooltip: 'Search & Replace' },
    { id: 'database', icon: Database, label: 'Database', tooltip: 'Database Connections' },
    { id: 'visualization', icon: BarChart3, label: 'Charts', tooltip: 'Data Visualization' },
    { id: 'version', icon: GitBranch, label: 'Version', tooltip: 'Version Control' },
    { id: 'terminal', icon: Terminal, label: 'Terminal', tooltip: 'Integrated Terminal' },
  ];

  const bottomItems = [
    { id: 'settings', icon: Settings, label: 'Settings', tooltip: 'Settings' },
  ];

  return (
    <div className="w-12 bg-sidebar-background border-r border-panel-border flex flex-col">
      {/* Top Items */}
      <div className="flex flex-col py-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className={`w-10 h-10 p-0 mx-1 mb-1 rounded ${
                activePanel === item.id
                  ? 'bg-sidebar-active text-primary'
                  : 'text-sidebar-foreground hover:text-foreground'
              }`}
              onClick={() => onPanelChange(item.id)}
              title={item.tooltip}
            >
              <Icon className="w-5 h-5" />
            </Button>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom Items */}
      <div className="flex flex-col pb-2">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className={`w-10 h-10 p-0 mx-1 mb-1 rounded ${
                activePanel === item.id
                  ? 'bg-sidebar-active text-primary'
                  : 'text-sidebar-foreground hover:text-foreground'
              }`}
              onClick={() => onPanelChange(item.id)}
              title={item.tooltip}
            >
              <Icon className="w-5 h-5" />
            </Button>
          );
        })}
      </div>
    </div>
  );
};
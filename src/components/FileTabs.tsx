import React, { useState } from 'react';
import { X, Plus, File, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface FileTab {
  id: string;
  name: string;
  type: 'sql' | 'python';
  isActive: boolean;
  isDirty: boolean;
}

interface FileTabsProps {
  tabs: FileTab[];
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  onNewFile: (type: 'sql' | 'python') => void;
}

export const FileTabs = ({ tabs, onTabClick, onTabClose, onNewFile }: FileTabsProps) => {
  const getFileIcon = (type: string) => {
    return type === 'sql' ? Database : File;
  };

  return (
    <div className="flex items-center bg-panel-background border-b border-panel-border h-10">
      {/* File Tabs */}
      <div className="flex flex-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = getFileIcon(tab.type);
          return (
            <div
              key={tab.id}
              className={`tab-button flex items-center gap-2 min-w-0 ${
                tab.isActive ? 'active' : ''
              }`}
              onClick={() => onTabClick(tab.id)}
            >
              <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate text-sm">
                {tab.name}
                {tab.isDirty && <span className="text-warning ml-1">•</span>}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="w-4 h-4 p-0 hover:bg-muted opacity-70 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          );
        })}
      </div>

      {/* New File Buttons */}
      <div className="flex items-center gap-1 px-2 border-l border-panel-border">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => onNewFile('sql')}
          title="New SQL File"
        >
          <Database className="w-4 h-4 mr-1" />
          SQL
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => onNewFile('python')}
          title="New Python File"
        >
          <File className="w-4 h-4 mr-1" />
          Python
        </Button>
      </div>
    </div>
  );
};
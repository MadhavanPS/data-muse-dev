import React, { useState } from 'react';
import { Play, Save, Undo, Redo, Copy, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface CodeEditorProps {
  activeFile?: string;
  language: 'sql' | 'python' | 'csv' | 'json';
  content: string;
  onChange: (content: string) => void;
  onRun?: () => void;
  onSave?: () => void;
}

export const CodeEditor = ({ 
  activeFile, 
  language, 
  content, 
  onChange, 
  onRun, 
  onSave 
}: CodeEditorProps) => {
  const [lineNumbers, setLineNumbers] = useState<number[]>([]);
  
  // Update line numbers when content changes
  React.useEffect(() => {
    const lines = content.split('\n').length;
    setLineNumbers(Array.from({ length: lines }, (_, i) => i + 1));
  }, [content]);

  const getLanguageLabel = () => {
    switch(language) {
      case 'sql': return 'SQL';
      case 'python': return 'Python';
      case 'csv': return 'CSV Data';
      case 'json': return 'JSON';
      default: return 'File';
    }
  };

  const getSampleContent = () => {
    if (language === 'sql') {
      return `-- SQL Query Editor
-- Start writing your SQL queries here

SELECT 
    column1,
    column2,
    COUNT(*) as count
FROM your_table
WHERE condition = 'value'
GROUP BY column1, column2
ORDER BY count DESC;`;
    } else if (language === 'python') {
      return `# Python Code Editor
# Start writing your Python code here

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

def analyze_data(df):
    """
    Analyze dataset and return insights
    """
    return df.describe()

# Your code here`;
    } else if (language === 'json') {
      return `{
  "name": "example-data",
  "version": "1.0.0",
  "data": [
    {
      "id": 1,
      "name": "Sample Record",
      "value": 100
    }
  ],
  "metadata": {
    "created": "2024-01-01",
    "source": "AI Assistant"
  }
}`;
    } else {
      return `# CSV Dataset
# This file contains your cleaned dataset
# Use the AI assistant to analyze this data

# Dataset is ready for analysis
# Ask questions like "Show me the top 5 performers" in the chat`;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-editor-background">
      {/* Editor Toolbar */}
      <div className="bg-panel-background border-b border-panel-border px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-panel-foreground">
              {activeFile || `Untitled.${language}`} • {getLanguageLabel()}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" title="Search">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" title="Undo">
              <Undo className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" title="Redo">
              <Redo className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" title="Copy">
              <Copy className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onSave}
              title="Save (Ctrl+S)"
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
            {(language !== 'csv' && language !== 'json') && (
              <Button 
                variant="default" 
                size="sm"
                onClick={onRun}
                title={`Run ${getLanguageLabel()}`}
              >
                <Play className="w-4 h-4 mr-1" />
                Run
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 flex">
        {/* Line Numbers */}
        <div className="w-12 bg-editor-background border-r border-panel-border text-editor-line-numbers text-sm font-mono flex flex-col">
          <div className="flex-1 px-2 py-4">
            {lineNumbers.map((num) => (
              <div key={num} className="h-6 flex items-center justify-end leading-6">
                {num}
              </div>
            ))}
          </div>
        </div>

        {/* Code Area */}
        <div className="flex-1 relative">
          <Textarea
            value={content || getSampleContent()}
            onChange={(e) => onChange(e.target.value)}
            className="editor-area w-full h-full border-0 rounded-none resize-none focus:ring-0 text-sm leading-6 p-4"
            style={{ 
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
              lineHeight: '24px'
            }}
            placeholder={`Start writing ${getLanguageLabel()} code...`}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-panel-background border-t border-panel-border px-4 py-1 text-xs text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>Line {content.split('\n').length}, Column 1</span>
          <span>{getLanguageLabel()}</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Ready</span>
        </div>
      </div>
    </div>
  );
};
import React, { useState, useRef, useCallback } from 'react';
import { Play, Save, Undo, Redo, Copy, Search, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useEditor } from '@/contexts/EditorContext';
import { InlineCodeDiff } from '@/components/InlineCodeDiff';

interface CodeEditorProps {
  activeFile?: string;
  language: 'sql' | 'python' | 'csv' | 'json';
  content: string;
  onChange: (content: string) => void;
  onRun?: () => void;
  onSave?: () => void;
  onSendToAssistant?: (selectedCode: string) => void;
  pendingChanges?: {
    originalCode: string;
    newCode: string;
    fullContent: string;
    onApprove: () => void;
    onReject: () => void;
  };
}

export const CodeEditor = ({ 
  activeFile, 
  language, 
  content, 
  onChange, 
  onRun, 
  onSave,
  onSendToAssistant,
  pendingChanges
}: CodeEditorProps) => {
  const [lineNumbers, setLineNumbers] = useState<number[]>([]);
  const [showSendButton, setShowSendButton] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { setSelectedText } = useEditor();
  
  // Update line numbers when content changes
  React.useEffect(() => {
    const lines = content.split('\n').length;
    setLineNumbers(Array.from({ length: lines }, (_, i) => i + 1));
  }, [content]);

  const handleTextSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    
    if (selectedText.trim()) {
      // Calculate button position relative to the selection
      const rect = textarea.getBoundingClientRect();
      const { selectionStart, selectionEnd } = textarea;
      
      // Approximate position based on character position
      const beforeText = textarea.value.substring(0, selectionStart);
      const lines = beforeText.split('\n');
      const currentLine = lines.length - 1;
      const currentCol = lines[lines.length - 1].length;
      
      // Position the button near the selection
      setButtonPosition({
        x: rect.left + Math.min(currentCol * 8, rect.width - 150), // Approximate character width
        y: rect.top + (currentLine * 24) - 40 // Line height approximation
      });
      
      setShowSendButton(true);
      setSelectedText(selectedText);
    } else {
      setShowSendButton(false);
      setSelectedText('');
    }
  }, [setSelectedText]);

  const handleSendToAssistant = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    if (selectedText.trim() && onSendToAssistant) {
      onSendToAssistant(selectedText);
      setShowSendButton(false);
    }
  };

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
      <div className="flex-1 flex relative">        
        {/* Always show the original editor content */}
        <>
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
              ref={textareaRef}
              value={content || getSampleContent()}
              onChange={(e) => onChange(e.target.value)}
              onSelect={handleTextSelection}
              onMouseUp={handleTextSelection}
              className="editor-area w-full h-full border-0 rounded-none resize-none focus:ring-0 text-sm leading-6 p-4"
              style={{ 
                fontFamily: 'var(--font-mono)',
                fontSize: '14px',
                lineHeight: '24px'
              }}
              placeholder={`Start writing ${getLanguageLabel()} code...`}
            />
            
            {/* Send to Assistant Button */}
            {showSendButton && (
              <div 
                className="absolute z-10 animate-fade-in"
                style={{
                  left: `${Math.max(10, Math.min(buttonPosition.x - 70, 300))}px`,
                  top: `${Math.max(10, buttonPosition.y)}px`
                }}
              >
                <Button
                  size="sm"
                  onClick={handleSendToAssistant}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg border border-blue-500"
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Send to Assistant
                </Button>
              </div>
            )}
            
            {/* Diff Overlay - shows changes on top of existing code */}
            {pendingChanges && (
              <div className="absolute inset-0 z-10 pointer-events-none">
                <InlineCodeDiff
                  originalCode={pendingChanges.originalCode}
                  newCode={pendingChanges.newCode}
                  fullContent={pendingChanges.fullContent}
                  language={language}
                  onApprove={pendingChanges.onApprove}
                  onReject={pendingChanges.onReject}
                  className="w-full h-full pointer-events-auto"
                />
              </div>
            )}
          </div>
        </>
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
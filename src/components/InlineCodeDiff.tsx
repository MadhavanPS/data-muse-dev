import React, { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber: number;
}

interface InlineCodeDiffProps {
  originalCode: string;
  newCode: string;
  language: 'sql' | 'python' | 'csv' | 'json';
  onApprove: () => void;
  onReject: () => void;
  className?: string;
}

export const InlineCodeDiff = ({ 
  originalCode, 
  newCode, 
  language, 
  onApprove, 
  onReject,
  className = ""
}: InlineCodeDiffProps) => {
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);

  useEffect(() => {
    const generateInlineDiff = () => {
      // For inline changes, we want to show the original code with changes highlighted
      // This creates a better context-aware diff
      
      const originalLines = originalCode.split('\n');
      const newCodeLines = newCode.split('\n');
      const diff: DiffLine[] = [];
      
      let lineNumber = 1;
      
      // Simple algorithm: compare line by line and highlight differences
      const maxLines = Math.max(originalLines.length, newCodeLines.length);
      
      for (let i = 0; i < maxLines; i++) {
        const originalLine = originalLines[i];
        const newLine = newCodeLines[i];
        
        if (i >= originalLines.length) {
          // New line added
          diff.push({ type: 'added', content: newLine || '', lineNumber });
        } else if (i >= newCodeLines.length) {
          // Line removed
          diff.push({ type: 'removed', content: originalLine || '', lineNumber: -1 });
        } else if (originalLine === newLine) {
          // Line unchanged
          diff.push({ type: 'unchanged', content: originalLine, lineNumber });
        } else {
          // Line modified - show both
          if (originalLine.trim()) {
            diff.push({ type: 'removed', content: originalLine, lineNumber: -1 });
          }
          if (newLine.trim()) {
            diff.push({ type: 'added', content: newLine, lineNumber });
          }
        }
        
        lineNumber++;
      }
      
      setDiffLines(diff);
    };

    generateInlineDiff();
  }, [originalCode, newCode]);

  const getLineStyle = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return 'bg-green-500/20 border-l-2 border-l-green-500';
      case 'removed':
        return 'bg-red-500/20 border-l-2 border-l-red-500';
      default:
        return '';
    }
  };

  const getLinePrefix = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return '+';
      case 'removed':
        return '-';
      default:
        return ' ';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Approval Controls */}
      <div className="absolute top-2 right-2 z-10 flex gap-2 bg-background/90 backdrop-blur-sm rounded-md p-1 border shadow-lg">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onReject}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
        >
          <X className="w-3 h-3 mr-1" />
          Reject
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          onClick={onApprove}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Check className="w-3 h-3 mr-1" />
          Apply
        </Button>
      </div>

      {/* Diff Display */}
      <div className="flex h-full">
        {/* Line Numbers */}
        <div className="w-12 bg-editor-background border-r border-panel-border text-editor-line-numbers text-sm font-mono flex flex-col">
          <div className="flex-1 px-2 py-4">
            {diffLines.map((line, index) => (
              <div key={index} className={`h-6 flex items-center justify-end leading-6 ${getLineStyle(line.type)}`}>
                {line.lineNumber > 0 ? line.lineNumber : ''}
              </div>
            ))}
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 relative">
          <div className="h-full overflow-auto">
            <div className="p-4 font-mono text-sm leading-6">
              {diffLines.map((line, index) => (
                <div
                  key={index}
                  className={`flex min-h-[24px] ${getLineStyle(line.type)}`}
                >
                  <span className="w-4 text-muted-foreground mr-2 select-none flex-shrink-0">
                    {getLinePrefix(line.type)}
                  </span>
                  <span className="flex-1 whitespace-pre-wrap">{line.content}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
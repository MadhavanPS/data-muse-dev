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
  fullContent: string;
  language: 'sql' | 'python' | 'csv' | 'json';
  onApprove: () => void;
  onReject: () => void;
  className?: string;
}

export const InlineCodeDiff = ({ 
  originalCode, 
  newCode, 
  fullContent,
  language, 
  onApprove, 
  onReject,
  className = ""
}: InlineCodeDiffProps) => {
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);

  useEffect(() => {
    const generateInlineDiff = () => {
      console.log('Generating diff:', { originalCode: originalCode.length, newCode: newCode.length, fullContent: fullContent.length });
      
      // Parse the full content to understand where changes should be applied
      const fullLines = fullContent.split('\n');
      const originalLines = originalCode.split('\n');
      const newLines = newCode.split('\n');
      
      // Find where the original code appears in the full content
      let startLineIndex = -1;
      for (let i = 0; i <= fullLines.length - originalLines.length; i++) {
        let match = true;
        for (let j = 0; j < originalLines.length; j++) {
          if (fullLines[i + j]?.trim() !== originalLines[j]?.trim()) {
            match = false;
            break;
          }
        }
        if (match) {
          startLineIndex = i;
          break;
        }
      }
      
      console.log('Found match at line:', startLineIndex);
      
      const diff: DiffLine[] = [];
      let lineNumber = 1;
      
      for (let i = 0; i < fullLines.length; i++) {
        if (i >= startLineIndex && i < startLineIndex + originalLines.length && startLineIndex >= 0) {
          // This is part of the changed section
          const originalLineIndex = i - startLineIndex;
          const originalLine = originalLines[originalLineIndex];
          const newLine = newLines[originalLineIndex];
          
          if (originalLineIndex < newLines.length) {
            if (originalLine !== newLine) {
              // Line was modified
              diff.push({ type: 'removed', content: originalLine, lineNumber: -1 });
              diff.push({ type: 'added', content: newLine, lineNumber });
            } else {
              // Line unchanged
              diff.push({ type: 'unchanged', content: originalLine, lineNumber });
            }
          } else {
            // Line was removed
            diff.push({ type: 'removed', content: originalLine, lineNumber: -1 });
          }
        } else if (i === startLineIndex + originalLines.length && startLineIndex >= 0) {
          // Add any new lines that were added
          for (let j = originalLines.length; j < newLines.length; j++) {
            diff.push({ type: 'added', content: newLines[j], lineNumber });
            lineNumber++;
          }
          // Continue with remaining unchanged lines
          if (i < fullLines.length) {
            diff.push({ type: 'unchanged', content: fullLines[i], lineNumber });
          }
        } else {
          // Unchanged line in the full content
          diff.push({ type: 'unchanged', content: fullLines[i], lineNumber });
        }
        lineNumber++;
      }
      
      console.log('Generated diff lines:', diff.length);
      setDiffLines(diff);
    };

    generateInlineDiff();
  }, [originalCode, newCode, fullContent]);

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
    <div className={`absolute inset-0 bg-editor-background/95 backdrop-blur-sm ${className}`}>
      {/* Approval Controls */}
      <div className="absolute top-4 right-4 z-30 flex gap-2 bg-background/90 backdrop-blur-sm rounded-md p-2 border shadow-lg">
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
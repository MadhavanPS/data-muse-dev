import React from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber?: number;
}

interface DiffViewerProps {
  originalCode: string;
  newCode: string;
  onApprove: () => void;
  onReject: () => void;
  title?: string;
}

export const DiffViewer = ({ originalCode, newCode, onApprove, onReject, title = "Code Changes" }: DiffViewerProps) => {
  const generateDiff = (original: string, modified: string): DiffLine[] => {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    const diff: DiffLine[] = [];

    // Simple diff algorithm - can be enhanced with proper diff library
    let i = 0, j = 0;
    
    while (i < originalLines.length || j < modifiedLines.length) {
      if (i >= originalLines.length) {
        // All remaining lines are additions
        diff.push({ type: 'added', content: modifiedLines[j], lineNumber: j + 1 });
        j++;
      } else if (j >= modifiedLines.length) {
        // All remaining lines are removals
        diff.push({ type: 'removed', content: originalLines[i] });
        i++;
      } else if (originalLines[i] === modifiedLines[j]) {
        // Lines are the same
        diff.push({ type: 'unchanged', content: originalLines[i], lineNumber: j + 1 });
        i++;
        j++;
      } else {
        // Check if the original line exists later in modified
        const foundInModified = modifiedLines.slice(j).indexOf(originalLines[i]);
        const foundInOriginal = originalLines.slice(i).indexOf(modifiedLines[j]);
        
        if (foundInModified === -1 && foundInOriginal === -1) {
          // Both lines are different - mark as removed and added
          diff.push({ type: 'removed', content: originalLines[i] });
          diff.push({ type: 'added', content: modifiedLines[j], lineNumber: j + 1 });
          i++;
          j++;
        } else if (foundInModified === -1) {
          // Original line doesn't exist in modified - mark as removed
          diff.push({ type: 'removed', content: originalLines[i] });
          i++;
        } else {
          // Modified line doesn't exist in original - mark as added
          diff.push({ type: 'added', content: modifiedLines[j], lineNumber: j + 1 });
          j++;
        }
      }
    }

    return diff;
  };

  const diffLines = generateDiff(originalCode || '', newCode);

  const getLineStyle = (type: DiffLine['type']) => {
    switch (type) {
      case 'added':
        return 'bg-green-500/10 border-l-2 border-l-green-500 text-green-800 dark:text-green-200';
      case 'removed':
        return 'bg-red-500/10 border-l-2 border-l-red-500 text-red-800 dark:text-red-200';
      default:
        return 'bg-muted/20';
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
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>{title}</span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onReject}
              className="text-destructive hover:text-destructive"
            >
              <X className="w-4 h-4 mr-1" />
              Reject
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={onApprove}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Check className="w-4 h-4 mr-1" />
              Approve
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="max-h-96">
          <div className="bg-editor-background font-mono text-sm">
            {diffLines.map((line, index) => (
              <div
                key={index}
                className={`flex ${getLineStyle(line.type)} px-4 py-1`}
              >
                <span className="w-8 text-muted-foreground text-right mr-3 select-none">
                  {line.lineNumber || ''}
                </span>
                <span className="w-4 text-muted-foreground mr-2 select-none">
                  {getLinePrefix(line.type)}
                </span>
                <span className="flex-1 whitespace-pre-wrap">{line.content}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
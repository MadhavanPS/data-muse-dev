import React from 'react';
import { Code, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface CodeContextCardProps {
  selectedCode: string;
  fileName?: string;
  onRemove: () => void;
}

export const CodeContextCard = ({ selectedCode, fileName, onRemove }: CodeContextCardProps) => {
  const displayCode = selectedCode.length > 200 
    ? `${selectedCode.substring(0, 200)}...` 
    : selectedCode;

  return (
    <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Code className="w-4 h-4" />
            <span className="text-sm font-medium">
              {fileName ? `Selected from ${fileName}` : 'Selected Code'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded p-2">
          <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono overflow-hidden">
            {displayCode}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};
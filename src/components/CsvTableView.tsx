import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CsvTableViewProps {
  content: string;
  maxRows?: number;
  className?: string;
}

export const CsvTableView = ({ content, maxRows = 100, className }: CsvTableViewProps) => {
  const parseCsvContent = (csvContent: string) => {
    if (!csvContent || csvContent.trim() === '') return { headers: [], rows: [] };
    
    const lines = csvContent.split('\n').filter(line => 
      line.trim() !== '' && !line.trim().startsWith('#')
    );
    
    if (lines.length === 0) return { headers: [], rows: [] };
    
    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
    const rows = lines.slice(1, maxRows + 1).map(line => 
      line.split(',').map(cell => cell.trim().replace(/"/g, ''))
    );
    
    return { headers, rows };
  };

  const { headers, rows } = parseCsvContent(content);

  if (headers.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 text-muted-foreground ${className}`}>
        <div className="text-center">
          <p className="text-lg mb-2">No CSV data to display</p>
          <p className="text-sm">Upload a CSV file or paste CSV content to view data</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <ScrollArea className="h-full max-h-[600px]">
        <div className="min-w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center font-mono text-xs text-muted-foreground">#</TableHead>
                {headers.map((header, index) => (
                  <TableHead key={index} className="min-w-[120px] font-medium">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-muted/20' : ''}>
                  <TableCell className="text-center font-mono text-xs text-muted-foreground border-r">
                    {rowIndex + 1}
                  </TableCell>
                  {row.map((cell, cellIndex) => (
                    <TableCell key={cellIndex} className="font-mono text-sm">
                      {cell || <span className="text-muted-foreground italic">NULL</span>}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
      {rows.length > 0 && (
        <div className="mt-4 p-3 bg-muted/30 rounded-md border text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Showing {rows.length} rows × {headers.length} columns</span>
            {rows.length >= maxRows && (
              <span className="text-xs">Limited to first {maxRows} rows</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
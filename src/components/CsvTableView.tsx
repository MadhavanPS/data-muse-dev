import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CsvTableViewProps {
  content: string;
  fileName?: string;
}

interface ParsedCsv {
  headers: string[];
  rows: string[][];
  stats: {
    totalRows: number;
    totalColumns: number;
    cleaningOperations?: string[];
  };
  summary?: string[];
}

const parseCsvContent = (content: string): ParsedCsv => {
  const lines = content.split('\n').filter(line => line.trim() !== '');
  
  // Extract cleaning summary comments
  const summaryLines: string[] = [];
  const dataLines: string[] = [];
  
  lines.forEach(line => {
    if (line.startsWith('#')) {
      summaryLines.push(line.replace(/^#\s*/, ''));
    } else {
      dataLines.push(line);
    }
  });
  
  if (dataLines.length === 0) {
    return {
      headers: [],
      rows: [],
      stats: { totalRows: 0, totalColumns: 0 },
      summary: summaryLines
    };
  }
  
  // Parse CSV data
  const headers = dataLines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows = dataLines.slice(1).map(line => 
    line.split(',').map(cell => cell.trim().replace(/"/g, ''))
  );
  
  return {
    headers,
    rows,
    stats: {
      totalRows: rows.length,
      totalColumns: headers.length,
    },
    summary: summaryLines
  };
};

export const CsvTableView = ({ content, fileName }: CsvTableViewProps) => {
  const parsedData = useMemo(() => parseCsvContent(content), [content]);
  
  if (!content || content.trim() === '') {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">No CSV data loaded</p>
          <p className="text-sm">Upload a CSV file to view data in table format</p>
        </div>
      </div>
    );
  }

  const { headers, rows, stats, summary } = parsedData;

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Summary Section */}
      {summary && summary.length > 0 && (
        <Card className="m-4 mb-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Dataset Information
              <Badge variant="secondary" className="text-xs">
                {stats.totalRows} rows × {stats.totalColumns} cols
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1 text-xs text-muted-foreground">
              {summary.map((line, index) => (
                <div key={index} className="font-mono">
                  {line}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table Section */}
      {headers.length > 0 && (
        <div className="flex-1 mx-4 mb-4">
          <ScrollArea className="h-full rounded-md border bg-card">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur">
                <TableRow>
                  <TableHead className="w-12 text-center font-mono text-xs">#</TableHead>
                  {headers.map((header, index) => (
                    <TableHead key={index} className="font-medium min-w-[120px]">
                      <div className="truncate" title={header}>
                        {header}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 100).map((row, rowIndex) => (
                  <TableRow key={rowIndex} className="hover:bg-muted/50">
                    <TableCell className="text-center font-mono text-xs text-muted-foreground border-r">
                      {rowIndex + 1}
                    </TableCell>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex} className="font-mono text-xs">
                        <div className="truncate max-w-[200px]" title={cell}>
                          {cell === 'NULL' ? (
                            <span className="text-muted-foreground italic">NULL</span>
                          ) : (
                            cell
                          )}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {rows.length > 100 && (
              <div className="p-4 text-center text-sm text-muted-foreground border-t">
                Showing first 100 rows of {stats.totalRows} total rows
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
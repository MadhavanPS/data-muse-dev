import React, { useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CsvTableViewProps {
  content: string;
  fileName?: string;
  showHeadOnly?: boolean;
  maxRows?: number;
}

export const CsvTableView = ({ 
  content, 
  fileName, 
  showHeadOnly = true, 
  maxRows = 5 
}: CsvTableViewProps) => {
  const { headers, rows, totalRows, stats } = useMemo(() => {
    const lines = content
      .split('\n')
      .filter(line => !line.startsWith('#') && line.trim() !== '');
    
    if (lines.length === 0) {
      return { headers: [], rows: [], totalRows: 0, stats: null };
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataRows = lines.slice(1);
    
    // Show only first few rows if showHeadOnly is true
    const displayRows = showHeadOnly ? dataRows.slice(0, maxRows) : dataRows;
    
    const rows = displayRows.map(line => 
      line.split(',').map(cell => {
        let cleaned = cell.trim().replace(/"/g, '');
        if (cleaned === '' || cleaned.toLowerCase() === 'null' || cleaned === '-') {
          return 'NULL';
        }
        return cleaned;
      })
    );

    const stats = {
      totalRows: dataRows.length,
      columns: headers.length,
      showingRows: displayRows.length
    };

    return { headers, rows, totalRows: dataRows.length, stats };
  }, [content, showHeadOnly, maxRows]);

  if (headers.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No data to display</p>
        <p className="text-sm mt-2">Upload a CSV file to see the data table</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with stats */}
      <div className="p-4 border-b border-border bg-muted/5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">
            {fileName || 'CSV Data'}
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {stats?.totalRows} rows
            </Badge>
            <Badge variant="secondary">
              {stats?.columns} columns
            </Badge>
            {showHeadOnly && (
              <Badge variant="outline">
                df.head({maxRows})
              </Badge>
            )}
          </div>
        </div>
        
        {showHeadOnly && stats && stats.totalRows > maxRows && (
          <p className="text-sm text-muted-foreground">
            Showing first {stats.showingRows} of {stats.totalRows} rows
          </p>
        )}
      </div>

      {/* Table */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-muted-foreground font-mono text-xs">
                  #
                </TableHead>
                {headers.map((header, index) => (
                  <TableHead key={index} className="font-semibold">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {rowIndex}
                  </TableCell>
                  {row.map((cell, cellIndex) => (
                    <TableCell key={cellIndex} className="font-mono text-sm">
                      {cell === 'NULL' ? (
                        <span className="text-muted-foreground italic">NULL</span>
                      ) : (
                        <span className="break-all">{cell}</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
};
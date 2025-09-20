// CSV Processing and Cleaning Utility
// This will be integrated with your ML models for advanced dataset cleaning

interface DatasetStats {
  originalRows: number;
  cleanedRows: number;
  columns: number;
  cleaningOperations: string[];
}

export const parseAndCleanCsv = (csvContent: string) => {
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  
  if (lines.length === 0) {
    return { headers: [], rows: [], stats: null };
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const dataRows = lines.slice(1);
  
  const cleanedRows = dataRows.map(line => 
    line.split(',').map(cell => {
      let cleaned = cell.trim();
      
      // Remove quotes if they wrap the entire cell
      if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.slice(1, -1);
      }
      
      // Handle common null/empty representations
      if (cleaned.toLowerCase() === 'null' || 
          cleaned.toLowerCase() === 'n/a' || 
          cleaned === '' || 
          cleaned === '-') {
        return 'NULL';
      }
      
      return cleaned;
    })
  );

  const stats = {
    totalRows: cleanedRows.length,
    columns: headers.length,
    dataTypes: headers.map(() => 'mixed') // Could be enhanced to detect types
  };

  return { headers, rows: cleanedRows, stats };
};

export const getCsvHead = (csvContent: string, numRows: number = 5) => {
  const { headers, rows } = parseAndCleanCsv(csvContent);
  const headRows = rows.slice(0, numRows);
  
  // Convert back to CSV format for display
  const csvLines = [
    headers.join(','),
    ...headRows.map(row => row.join(','))
  ];
  
  return csvLines.join('\n');
};

export const cleanDataset = (csvContent: string): { cleanedContent: string; stats: DatasetStats } => {
  const { headers, rows, stats: parseStats } = parseAndCleanCsv(csvContent);
  
  const cleaningOperations = [
    'Basic formatting and null value standardization',
    'Trimmed whitespace and removed quotes',
    'Standardized null representations'
  ];
  
  const stats: DatasetStats = {
    originalRows: rows.length,
    cleanedRows: rows.length,
    columns: headers.length,
    cleaningOperations
  };
  
  // Create cleaned content with df.head() preview
  const headPreview = getCsvHead(csvContent, 5);
  const cleaningSummary = `# Dataset Cleaning Summary
# Original rows: ${stats.originalRows}
# Cleaned rows: ${stats.cleanedRows}
# Columns: ${stats.columns}
# Operations: ${stats.cleaningOperations.join(', ')}
# 
# df.head() - First 5 rows preview:
# ================================

${headPreview}

# Full dataset available for analysis - Ask the AI assistant about this data!
`;
  
  return {
    cleanedContent: cleaningSummary,
    stats
  };
};

export const analyzeCsvQuery = (csvContent: string, query: string): string => {
  // This is a placeholder for your ML model integration
  // Your ML model will process the query and CSV content to provide insights
  
  const lines = csvContent.split('\n').filter(line => !line.startsWith('#') && line.trim() !== '');
  const headers = lines[0]?.split(',') || [];
  const dataRows = lines.slice(1);
  
  // Simple query analysis (will be replaced by your ML model)
  if (query.toLowerCase().includes('top') && query.toLowerCase().includes('5')) {
    return `Based on the dataset with ${dataRows.length} rows and columns: ${headers.join(', ')}, I would analyze the data to find the top 5 entries. Your ML model will process this query and provide specific insights.`;
  }
  
  if (query.toLowerCase().includes('perform')) {
    return `I can see ${dataRows.length} records in your dataset. Once your ML model is integrated, I'll analyze performance metrics and provide detailed insights.`;
  }
  
  return `I can analyze your dataset with ${dataRows.length} rows and ${headers.length} columns. Your ML model will process: "${query}" and provide specific data insights.`;
};
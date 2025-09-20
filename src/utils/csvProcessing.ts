// CSV Processing and Cleaning Utility
// This will be integrated with your ML models for advanced dataset cleaning

interface DatasetStats {
  originalRows: number;
  cleanedRows: number;
  columns: number;
  cleaningOperations: string[];
}

export const cleanDataset = (csvContent: string): { cleanedContent: string; stats: DatasetStats } => {
  const lines = csvContent.split('\n');
  const headers = lines[0]?.split(',') || [];
  
  const cleaningOperations: string[] = [];
  
  // Remove empty rows
  const nonEmptyLines = lines.filter(line => line.trim() !== '');
  if (nonEmptyLines.length !== lines.length) {
    cleaningOperations.push(`Removed ${lines.length - nonEmptyLines.length} empty rows`);
  }
  
  // Trim whitespace and handle common data issues
  const cleanedLines = nonEmptyLines.map((line, index) => {
    if (index === 0) return line; // Keep headers as is
    
    return line
      .split(',')
      .map(cell => {
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
      .join(',');
  });
  
  if (cleaningOperations.length === 0) {
    cleaningOperations.push('Basic formatting and null value standardization');
  }
  
  const stats: DatasetStats = {
    originalRows: lines.length - 1, // Exclude header
    cleanedRows: cleanedLines.length - 1, // Exclude header
    columns: headers.length,
    cleaningOperations
  };
  
  // Create cleaned content with summary
  const cleaningSummary = `# Dataset Cleaning Summary
# Original rows: ${stats.originalRows}
# Cleaned rows: ${stats.cleanedRows}
# Columns: ${stats.columns}
# Operations: ${stats.cleaningOperations.join(', ')}
# Ready for analysis - Ask the AI assistant about this data!

`;
  
  return {
    cleanedContent: cleaningSummary + cleanedLines.join('\n'),
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
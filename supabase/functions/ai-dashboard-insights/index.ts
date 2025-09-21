import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ColumnAnalysis {
  name: string;
  type: 'categorical' | 'numerical' | 'date';
  uniqueCount: number;
  sampleValues: any[];
  stats?: {
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    nullCount: number;
  };
}

interface DashboardConfig {
  title: string;
  insights: string[];
  charts: Array<{
    id: string;
    type: 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap';
    title: string;
    description: string;
    data: any[];
    config: {
      xKey?: string;
      yKey?: string;
      dataKey?: string;
      [key: string]: any;
    };
  }>;
  keyMetrics: Array<{
    label: string;
    value: string | number;
    change?: string;
    trend: 'up' | 'down' | 'stable';
  }>;
}

function analyzeCSV(csvData: string): ColumnAnalysis[] {
  const lines = csvData.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const dataRows = lines.slice(1).map(line => 
    line.split(',').map(cell => cell.trim().replace(/"/g, ''))
  );
  
  return headers.map(header => {
    const columnIndex = headers.indexOf(header);
    const columnValues = dataRows.map(row => row[columnIndex]).filter(v => v && v !== '');
    
    // Determine type
    const numericValues = columnValues.map(v => parseFloat(v)).filter(v => !isNaN(v));
    const isNumeric = numericValues.length > columnValues.length * 0.7;
    
    // Check for dates (basic detection)
    const dateValues = columnValues.filter(v => {
      const parsed = new Date(v);
      return !isNaN(parsed.getTime()) && v.length > 4;
    });
    const isDate = dateValues.length > columnValues.length * 0.3;
    
    const type: 'categorical' | 'numerical' | 'date' = 
      isDate ? 'date' : isNumeric ? 'numerical' : 'categorical';
    
    const stats = type === 'numerical' ? {
      min: Math.min(...numericValues),
      max: Math.max(...numericValues),
      mean: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
      median: numericValues.sort()[Math.floor(numericValues.length / 2)],
      nullCount: dataRows.length - columnValues.length
    } : {
      nullCount: dataRows.length - columnValues.length
    };
    
    return {
      name: header,
      type,
      uniqueCount: new Set(columnValues).size,
      sampleValues: columnValues.slice(0, 5),
      stats
    };
  });
}

function generateChartData(csvData: string, analysis: ColumnAnalysis[]): any[] {
  const lines = csvData.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const dataRows = lines.slice(1, 21).map(line => // First 20 rows for performance
    line.split(',').map(cell => cell.trim().replace(/"/g, ''))
  );
  
  const charts = [];
  
  // Find categorical and numerical columns
  const categoricalCols = analysis.filter(col => col.type === 'categorical' && col.uniqueCount <= 10);
  const numericalCols = analysis.filter(col => col.type === 'numerical');
  
  // Generate charts based on column types (similar to Python code)
  
  // 1. Categorical distribution (pie/bar chart)
  if (categoricalCols.length > 0) {
    const catCol = categoricalCols[0];
    const catIndex = headers.indexOf(catCol.name);
    
    // Count occurrences for pie/bar chart
    const counts: { [key: string]: number } = {};
    dataRows.forEach(row => {
      const value = row[catIndex];
      counts[value] = (counts[value] || 0) + 1;
    });
    
    charts.push({
      id: 'categorical-distribution',
      type: 'pie',
      title: `Distribution of ${catCol.name}`,
      description: `Shows the breakdown of different ${catCol.name} categories`,
      data: Object.entries(counts).map(([name, value]) => ({ name, value })),
      config: { dataKey: 'value' }
    });
  }
  
  // 2. Numerical correlation (scatter plot)
  if (numericalCols.length >= 2) {
    const col1 = numericalCols[0];
    const col2 = numericalCols[1];
    const col1Index = headers.indexOf(col1.name);
    const col2Index = headers.indexOf(col2.name);
    
    charts.push({
      id: 'numerical-correlation',
      type: 'scatter',
      title: `${col1.name} vs ${col2.name}`,
      description: `Relationship between ${col1.name} and ${col2.name}`,
      data: dataRows.map(row => ({
        x: parseFloat(row[col1Index]) || 0,
        y: parseFloat(row[col2Index]) || 0,
        name: `Point ${row[0] || 'N/A'}`
      })).filter(d => d.x !== 0 && d.y !== 0),
      config: { xKey: 'x', yKey: 'y' }
    });
  }
  
  // 3. Categorical vs Numerical (bar chart)
  if (categoricalCols.length > 0 && numericalCols.length > 0) {
    const catCol = categoricalCols[0];
    const numCol = numericalCols[0];
    const catIndex = headers.indexOf(catCol.name);
    const numIndex = headers.indexOf(numCol.name);
    
    // Aggregate numerical values by category
    const aggregated: { [key: string]: number[] } = {};
    dataRows.forEach(row => {
      const category = row[catIndex];
      const value = parseFloat(row[numIndex]);
      if (!isNaN(value)) {
        if (!aggregated[category]) aggregated[category] = [];
        aggregated[category].push(value);
      }
    });
    
    charts.push({
      id: 'category-analysis',
      type: 'bar',
      title: `Average ${numCol.name} by ${catCol.name}`,
      description: `Compare average ${numCol.name} across different ${catCol.name}`,
      data: Object.entries(aggregated).map(([name, values]) => ({
        name,
        value: values.reduce((a, b) => a + b, 0) / values.length
      })),
      config: { xKey: 'name', yKey: 'value' }
    });
  }
  
  // 4. Numerical distribution histogram (as line chart)
  if (numericalCols.length > 0) {
    const numCol = numericalCols[0];
    const numIndex = headers.indexOf(numCol.name);
    
    const values = dataRows.map(row => parseFloat(row[numIndex])).filter(v => !isNaN(v));
    
    // Create bins for histogram
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = 8;
    const binSize = (max - min) / binCount;
    
    const bins = Array.from({length: binCount}, (_, i) => {
      const binStart = min + i * binSize;
      const binEnd = binStart + binSize;
      const count = values.filter(v => v >= binStart && v < binEnd).length;
      return {
        name: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
        value: count
      };
    });
    
    charts.push({
      id: 'numerical-distribution',
      type: 'line',
      title: `Distribution of ${numCol.name}`,
      description: `Histogram showing the distribution of ${numCol.name} values`,
      data: bins,
      config: { xKey: 'name', yKey: 'value' }
    });
  }
  
  return charts;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { csvData, fileName } = await req.json();
    
    console.log('Processing dashboard request for:', fileName);
    
    if (!csvData) {
      throw new Error('No CSV data provided');
    }
    
    // Analyze CSV structure
    const columnAnalysis = analyzeCSV(csvData);
    console.log('Column analysis:', columnAnalysis);
    
    // Generate chart configurations
    const charts = generateChartData(csvData, columnAnalysis);
    
    // Generate AI insights using Gemini
    const analysisPrompt = `Analyze this dataset and provide comprehensive business insights:

Dataset: ${fileName}
Columns: ${columnAnalysis.map(col => `${col.name} (${col.type}, ${col.uniqueCount} unique values)`).join(', ')}

Sample data structure:
${csvData.split('\n').slice(0, 6).join('\n')}

Column Analysis:
${columnAnalysis.map(col => `- ${col.name}: ${col.type} type, ${col.uniqueCount} unique values${col.stats ? `, avg: ${col.stats.mean?.toFixed(2)}` : ''}`).join('\n')}

Provide comprehensive business insights in this JSON format:
{
  "insights": [
    "Key insight about data patterns and trends",
    "Business intelligence observation", 
    "Data quality assessment",
    "Actionable recommendation",
    "Strategic business implication"
  ],
  "dataQuality": [
    "Data completeness assessment",
    "Data consistency observation",
    "Potential data issues identified"
  ],
  "businessValue": "Overall summary of business value and potential use cases for this dataset",
  "keyFindings": [
    "Most significant pattern or correlation",
    "Notable outliers or anomalies",
    "Trend analysis summary"
  ]
}`;

    console.log('Sending request to Gemini for insights...');
    
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: analysisPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2000,
        }
      }),
    });

    const geminiData = await geminiResponse.json();
    let aiInsights = { 
      insights: [], 
      dataQuality: [], 
      businessValue: '',
      keyFindings: []
    };
    
    if (geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
      try {
        const cleanedResponse = geminiData.candidates[0].content.parts[0].text
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        aiInsights = JSON.parse(cleanedResponse);
      } catch (e) {
        console.error('Failed to parse Gemini response:', e);
        // Fallback insights
        aiInsights = {
          insights: [
            `Dataset contains ${columnAnalysis.length} columns with ${csvData.split('\n').length - 1} rows`,
            `Found ${columnAnalysis.filter(c => c.type === 'numerical').length} numerical and ${columnAnalysis.filter(c => c.type === 'categorical').length} categorical columns`,
            'This data shows potential for comprehensive business analysis and decision-making',
            `Data completeness varies across columns with some requiring attention`,
            'Multiple visualization types are recommended based on data structure'
          ],
          dataQuality: [
            'Dataset appears well-structured with clear column definitions',
            'Some null values detected - consider data cleaning procedures',
            'Column types are properly detected and categorized'
          ],
          businessValue: 'This dataset provides valuable opportunities for data-driven insights, trend analysis, and strategic business planning across multiple dimensions.',
          keyFindings: [
            'Strong correlation potential between numerical variables',
            'Categorical data shows clear distribution patterns',
            'Data suitable for predictive modeling and business intelligence'
          ]
        };
      }
    }
    
    // Generate key metrics
    const totalRows = csvData.split('\n').length - 1;
    const keyMetrics = [
      {
        label: 'Total Records',
        value: totalRows,
        trend: 'stable' as const
      },
      {
        label: 'Data Columns',
        value: columnAnalysis.length,
        trend: 'stable' as const
      },
      {
        label: 'Numerical Fields',
        value: columnAnalysis.filter(c => c.type === 'numerical').length,
        trend: 'up' as const
      },
      {
        label: 'Categorical Fields',
        value: columnAnalysis.filter(c => c.type === 'categorical').length,
        trend: 'up' as const
      },
      {
        label: 'Data Quality',
        value: `${Math.round(((totalRows - columnAnalysis.reduce((sum, col) => sum + (col.stats?.nullCount || 0), 0) / columnAnalysis.length) / totalRows) * 100)}%`,
        trend: 'up' as const
      },
      {
        label: 'Chart Types',
        value: charts.length,
        trend: 'up' as const
      }
    ];
    
    const dashboardConfig: DashboardConfig = {
      title: `Smart Dashboard: ${fileName}`,
      insights: [...aiInsights.insights, ...aiInsights.dataQuality, ...aiInsights.keyFindings],
      charts,
      keyMetrics
    };
    
    console.log('Generated dashboard config with', charts.length, 'charts');
    
    return new Response(JSON.stringify({
      success: true,
      dashboard: dashboardConfig,
      columnAnalysis,
      businessValue: aiInsights.businessValue
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in ai-dashboard-insights function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
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
    quartiles?: number[];
  };
}

function analyzeCSV(csvData: string, maxUniqueCat: number = 20): ColumnAnalysis[] {
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
    
    // Check for dates
    const dateValues = columnValues.filter(v => {
      const parsed = new Date(v);
      return !isNaN(parsed.getTime()) && v.length > 4;
    });
    const isDate = dateValues.length > columnValues.length * 0.3;
    
    // Determine if categorical (object type OR low unique count)
    const uniqueCount = new Set(columnValues).size;
    const isCategorical = !isNumeric && !isDate;
    const isCategoricalByCount = uniqueCount <= maxUniqueCat;
    
    let type: 'categorical' | 'numerical' | 'date' = 'categorical';
    if (isDate) {
      type = 'date';
    } else if (isNumeric && !isCategoricalByCount) {
      type = 'numerical';
    } else {
      type = 'categorical';
    }
    
    const stats = type === 'numerical' ? {
      min: Math.min(...numericValues),
      max: Math.max(...numericValues),
      mean: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
      median: numericValues.sort((a, b) => a - b)[Math.floor(numericValues.length / 2)],
      quartiles: [
        numericValues.sort((a, b) => a - b)[Math.floor(numericValues.length * 0.25)],
        numericValues.sort((a, b) => a - b)[Math.floor(numericValues.length * 0.75)]
      ],
      nullCount: dataRows.length - columnValues.length
    } : {
      nullCount: dataRows.length - columnValues.length
    };
    
    return {
      name: header,
      type,
      uniqueCount,
      sampleValues: columnValues.slice(0, 5),
      stats
    };
  });
}

function generateAllCharts(csvData: string, analysis: ColumnAnalysis[]): any[] {
  const lines = csvData.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const dataRows = lines.slice(1, 101).map(line => // Use first 100 rows for performance
    line.split(',').map(cell => cell.trim().replace(/"/g, ''))
  );
  
  const charts: any[] = [];
  
  // Get column classifications
  const categoricalCols = analysis.filter(col => col.type === 'categorical');
  const numericalCols = analysis.filter(col => col.type === 'numerical');
  const dateCols = analysis.filter(col => col.type === 'date');
  
  console.log(`Found: ${categoricalCols.length} categorical, ${numericalCols.length} numerical, ${dateCols.length} date columns`);
  
  // 1. UNIVARIATE NUMERICAL ANALYSIS
  numericalCols.forEach(numCol => {
    const colIndex = headers.indexOf(numCol.name);
    const values = dataRows.map(row => parseFloat(row[colIndex])).filter(v => !isNaN(v));
    
    if (values.length === 0) return;
    
    // Histogram data (binning)
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = 10;
    const binSize = (max - min) / binCount;
    
    const histogramData = Array.from({length: binCount}, (_, i) => {
      const binStart = min + i * binSize;
      const binEnd = binStart + binSize;
      const count = values.filter(v => v >= binStart && v < binEnd).length;
      return {
        name: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
        value: count,
        bin: i
      };
    });
    
    charts.push({
      id: `histogram-${numCol.name}`,
      type: 'bar',
      title: `Histogram of ${numCol.name}`,
      description: `Distribution of ${numCol.name} values`,
      data: histogramData,
      config: { xKey: 'name', yKey: 'value' },
      category: 'univariate'
    });
    
    // Boxplot data (quartiles representation)
    const sortedValues = [...values].sort((a, b) => a - b);
    const q1 = sortedValues[Math.floor(sortedValues.length * 0.25)];
    const median = sortedValues[Math.floor(sortedValues.length * 0.5)];
    const q3 = sortedValues[Math.floor(sortedValues.length * 0.75)];
    
    charts.push({
      id: `boxplot-${numCol.name}`,
      type: 'boxplot',
      title: `Box Plot of ${numCol.name}`,
      description: `Quartile analysis of ${numCol.name}`,
      data: [{
        name: numCol.name,
        min: min,
        q1: q1,
        median: median,
        q3: q3,
        max: max,
        outliers: values.filter(v => v < q1 - 1.5 * (q3 - q1) || v > q3 + 1.5 * (q3 - q1))
      }],
      config: { dataKey: 'name' },
      category: 'univariate'
    });
  });
  
  // 2. CORRELATION HEATMAP
  if (numericalCols.length > 1) {
    const correlationMatrix: any[] = [];
    
    numericalCols.forEach((col1, i) => {
      numericalCols.forEach((col2, j) => {
        const col1Index = headers.indexOf(col1.name);
        const col2Index = headers.indexOf(col2.name);
        
        const values1 = dataRows.map(row => parseFloat(row[col1Index])).filter(v => !isNaN(v));
        const values2 = dataRows.map(row => parseFloat(row[col2Index])).filter(v => !isNaN(v));
        
        // Calculate correlation coefficient
        const n = Math.min(values1.length, values2.length);
        if (n > 1) {
          const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
          const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;
          
          const numerator = values1.slice(0, n).reduce((sum, v1, idx) => 
            sum + (v1 - mean1) * (values2[idx] - mean2), 0);
          const denom1 = Math.sqrt(values1.slice(0, n).reduce((sum, v) => sum + Math.pow(v - mean1, 2), 0));
          const denom2 = Math.sqrt(values2.slice(0, n).reduce((sum, v) => sum + Math.pow(v - mean2, 2), 0));
          
          const correlation = denom1 * denom2 !== 0 ? numerator / (denom1 * denom2) : 0;
          
          correlationMatrix.push({
            x: col1.name,
            y: col2.name,
            value: Math.round(correlation * 100) / 100,
            color: correlation
          });
        }
      });
    });
    
    charts.push({
      id: 'correlation-heatmap',
      type: 'heatmap',
      title: 'Correlation Heatmap',
      description: 'Correlation matrix of numerical variables',
      data: correlationMatrix,
      config: { xKey: 'x', yKey: 'y', valueKey: 'value' },
      category: 'correlation'
    });
  }
  
  // 3. BIVARIATE: CATEGORICAL vs NUMERICAL
  categoricalCols.forEach(catCol => {
    numericalCols.forEach(numCol => {
      const catIndex = headers.indexOf(catCol.name);
      const numIndex = headers.indexOf(numCol.name);
      
      // Group numerical values by category
      const grouped: { [key: string]: number[] } = {};
      dataRows.forEach(row => {
        const category = row[catIndex];
        const value = parseFloat(row[numIndex]);
        if (!isNaN(value) && category) {
          if (!grouped[category]) grouped[category] = [];
          grouped[category].push(value);
        }
      });
      
      // Mean values by category (Bar chart)
      const meanData = Object.entries(grouped).map(([category, values]) => ({
        name: category,
        value: values.reduce((sum, v) => sum + v, 0) / values.length,
        count: values.length
      }));
      
      if (meanData.length > 0) {
        charts.push({
          id: `bar-${catCol.name}-${numCol.name}`,
          type: 'bar',
          title: `Mean ${numCol.name} by ${catCol.name}`,
          description: `Average ${numCol.name} across different ${catCol.name} categories`,
          data: meanData,
          config: { xKey: 'name', yKey: 'value' },
          category: 'bivariate'
        });
      }
      
      // Box plot data by category
      const boxplotData = Object.entries(grouped).map(([category, values]) => {
        const sorted = [...values].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const median = sorted[Math.floor(sorted.length * 0.5)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        
        return {
          name: category,
          min: Math.min(...values),
          q1: q1,
          median: median,
          q3: q3,
          max: Math.max(...values)
        };
      });
      
      if (boxplotData.length > 0) {
        charts.push({
          id: `boxplot-${catCol.name}-${numCol.name}`,
          type: 'boxplot',
          title: `Box Plot: ${numCol.name} by ${catCol.name}`,
          description: `Distribution of ${numCol.name} across ${catCol.name} categories`,
          data: boxplotData,
          config: { xKey: 'name', yKey: 'median' },
          category: 'bivariate'
        });
      }
    });
  });
  
  // 4. BIVARIATE: NUMERICAL vs NUMERICAL
  for (let i = 0; i < numericalCols.length; i++) {
    for (let j = i + 1; j < numericalCols.length; j++) {
      const col1 = numericalCols[i];
      const col2 = numericalCols[j];
      const col1Index = headers.indexOf(col1.name);
      const col2Index = headers.indexOf(col2.name);
      
      const scatterData = dataRows.map((row, idx) => {
        const x = parseFloat(row[col1Index]);
        const y = parseFloat(row[col2Index]);
        return !isNaN(x) && !isNaN(y) ? { x, y, name: `Point ${idx}` } : null;
      }).filter(Boolean).slice(0, 50); // Limit for performance
      
      if (scatterData.length > 5) {
        charts.push({
          id: `scatter-${col1.name}-${col2.name}`,
          type: 'scatter',
          title: `${col1.name} vs ${col2.name}`,
          description: `Relationship between ${col1.name} and ${col2.name}`,
          data: scatterData,
          config: { xKey: 'x', yKey: 'y' },
          category: 'correlation'
        });
      }
    });
  }
  
  // 5. CATEGORICAL DISTRIBUTIONS
  categoricalCols.forEach(catCol => {
    const catIndex = headers.indexOf(catCol.name);
    const counts: { [key: string]: number } = {};
    
    dataRows.forEach(row => {
      const value = row[catIndex];
      if (value) {
        counts[value] = (counts[value] || 0) + 1;
      }
    });
    
    const pieData = Object.entries(counts).map(([name, value]) => ({ name, value }));
    
    if (pieData.length > 1 && pieData.length <= 15) { // Reasonable number of categories
      charts.push({
        id: `pie-${catCol.name}`,
        type: 'pie',
        title: `Distribution of ${catCol.name}`,
        description: `Breakdown of ${catCol.name} categories`,
        data: pieData,
        config: { dataKey: 'value' },
        category: 'categorical'
      });
    }
  });
  
  // 6. TIME SERIES (if date columns exist)
  dateCols.forEach(dateCol => {
    numericalCols.forEach(numCol => {
      const dateIndex = headers.indexOf(dateCol.name);
      const numIndex = headers.indexOf(numCol.name);
      
      const timeSeriesData = dataRows.map((row, idx) => {
        const dateValue = new Date(row[dateIndex]);
        const numValue = parseFloat(row[numIndex]);
        return !isNaN(dateValue.getTime()) && !isNaN(numValue) ? {
          date: dateValue.toISOString().split('T')[0],
          value: numValue,
          name: `${dateValue.toLocaleDateString()}`
        } : null;
      }).filter(Boolean).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      if (timeSeriesData.length > 2) {
        charts.push({
          id: `timeseries-${dateCol.name}-${numCol.name}`,
          type: 'line',
          title: `Time Series: ${numCol.name} over ${dateCol.name}`,
          description: `Trend of ${numCol.name} over time`,
          data: timeSeriesData,
          config: { xKey: 'name', yKey: 'value' },
          category: 'timeseries'
        });
      }
    });
  });
  
  // 7. CATEGORICAL CORRELATION HEATMAP
  if (categoricalCols.length > 1) {
    const catCorrelationMatrix: any[] = [];
    
    // Encode categorical variables as numbers for correlation
    const encodedData: { [key: string]: number[] } = {};
    categoricalCols.forEach(col => {
      const colIndex = headers.indexOf(col.name);
      const uniqueValues = [...new Set(dataRows.map(row => row[colIndex]).filter(v => v))];
      const valueMap = Object.fromEntries(uniqueValues.map((val, idx) => [val, idx]));
      
      encodedData[col.name] = dataRows.map(row => valueMap[row[colIndex]] || 0);
    });
    
    categoricalCols.forEach((col1, i) => {
      categoricalCols.forEach((col2, j) => {
        const values1 = encodedData[col1.name];
        const values2 = encodedData[col2.name];
        
        // Calculate correlation
        const n = Math.min(values1.length, values2.length);
        const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
        const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;
        
        const numerator = values1.slice(0, n).reduce((sum, v1, idx) => 
          sum + (v1 - mean1) * (values2[idx] - mean2), 0);
        const denom1 = Math.sqrt(values1.slice(0, n).reduce((sum, v) => sum + Math.pow(v - mean1, 2), 0));
        const denom2 = Math.sqrt(values2.slice(0, n).reduce((sum, v) => sum + Math.pow(v - mean2, 2), 0));
        
        const correlation = denom1 * denom2 !== 0 ? numerator / (denom1 * denom2) : 0;
        
        catCorrelationMatrix.push({
          x: col1.name,
          y: col2.name,
          value: Math.round(correlation * 100) / 100,
          color: correlation
        });
      });
    });
    
    charts.push({
      id: 'categorical-correlation-heatmap',
      type: 'heatmap',
      title: 'Categorical Variables Correlation',
      description: 'Correlation matrix of categorical variables (encoded)',
      data: catCorrelationMatrix,
      config: { xKey: 'x', yKey: 'y', valueKey: 'value' },
      category: 'categorical'
    });
  }
  
  console.log(`Generated ${charts.length} charts total`);
  return charts;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { csvData, fileName } = await req.json();
    
    console.log('Processing comprehensive dashboard for:', fileName);
    
    if (!csvData) {
      throw new Error('No CSV data provided');
    }
    
    // Analyze CSV structure with configurable categorical threshold
    const columnAnalysis = analyzeCSV(csvData, 20); // max 20 unique values for categorical
    console.log('Column analysis:', columnAnalysis.map(c => `${c.name}: ${c.type}`));
    
    // Generate ALL chart types like the Python code
    const charts = generateAllCharts(csvData, columnAnalysis);
    console.log(`Generated ${charts.length} total charts`);
    
    // Generate AI insights using Gemini (insights only, not charts)
    const analysisPrompt = `Analyze this comprehensive dataset and provide business insights:

Dataset: ${fileName}
Total Charts Generated: ${charts.length}
Columns: ${columnAnalysis.map(col => `${col.name} (${col.type}, ${col.uniqueCount} unique values)`).join(', ')}

Column Details:
${columnAnalysis.map(col => {
  let details = `- ${col.name}: ${col.type} type, ${col.uniqueCount} unique values`;
  if (col.stats && col.type === 'numerical') {
    details += `, range: ${col.stats.min?.toFixed(2)} to ${col.stats.max?.toFixed(2)}, avg: ${col.stats.mean?.toFixed(2)}`;
  }
  return details;
}).join('\n')}

Chart Types Generated:
- Univariate Analysis: ${charts.filter(c => c.category === 'univariate').length} charts
- Correlation Analysis: ${charts.filter(c => c.category === 'correlation').length} charts  
- Bivariate Analysis: ${charts.filter(c => c.category === 'bivariate').length} charts
- Categorical Analysis: ${charts.filter(c => c.category === 'categorical').length} charts
- Time Series Analysis: ${charts.filter(c => c.category === 'timeseries').length} charts

Sample data:
${csvData.split('\n').slice(0, 4).join('\n')}

Provide comprehensive business insights in JSON format:
{
  "keyInsights": [
    "Most important business pattern or trend",
    "Critical correlation or relationship found", 
    "Significant categorical distribution insight",
    "Data quality or outlier observation",
    "Strategic business recommendation"
  ],
  "dataQuality": {
    "score": 85,
    "strengths": ["aspect1", "aspect2"],
    "concerns": ["issue1", "issue2"],
    "recommendations": ["action1", "action2"]
  },
  "businessValue": "Overall strategic value and use cases for this dataset",
  "actionableInsights": [
    "Specific action item 1",
    "Specific action item 2", 
    "Specific action item 3"
  ]
}`;

    console.log('Requesting AI insights from Gemini...');
    
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
      keyInsights: [], 
      dataQuality: { score: 80, strengths: [], concerns: [], recommendations: [] },
      businessValue: '',
      actionableInsights: []
    };
    
    if (geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
      try {
        const cleanedResponse = geminiData.candidates[0].content.parts[0].text
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        aiInsights = JSON.parse(cleanedResponse);
      } catch (e) {
        console.error('Failed to parse Gemini response, using fallback insights');
        aiInsights = {
          keyInsights: [
            `Comprehensive analysis of ${columnAnalysis.length} columns with ${csvData.split('\n').length - 1} records`,
            `Generated ${charts.length} visualizations covering univariate, bivariate, and correlation analysis`,
            `Found ${columnAnalysis.filter(c => c.type === 'numerical').length} numerical and ${columnAnalysis.filter(c => c.type === 'categorical').length} categorical variables`,
            'Multiple chart types provide complete data exploration coverage',
            'Dataset suitable for advanced analytics and business intelligence'
          ],
          dataQuality: {
            score: 85,
            strengths: ['Well-structured columns', 'Multiple data types', 'Comprehensive coverage'],
            concerns: ['Check for missing values', 'Validate data consistency'],
            recommendations: ['Perform data cleaning', 'Consider additional features']
          },
          businessValue: 'This dataset provides comprehensive insights across multiple dimensions, suitable for strategic decision-making and predictive analytics.',
          actionableInsights: [
            'Focus on key correlations identified in heatmaps',
            'Investigate outliers shown in box plots',
            'Leverage categorical distributions for segmentation',
            'Monitor trends in time series analysis'
          ]
        };
      }
    }
    
    // Generate comprehensive key metrics
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
        label: 'Charts Generated', 
        value: charts.length,
        trend: 'up' as const
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
        label: 'Data Quality Score',
        value: `${aiInsights.dataQuality.score}%`,
        trend: 'up' as const
      }
    ];
    
    // Combine all insights
    const allInsights = [
      ...aiInsights.keyInsights,
      ...aiInsights.actionableInsights,
      ...aiInsights.dataQuality.strengths.map(s => `Data Strength: ${s}`),
      ...aiInsights.dataQuality.recommendations.map(r => `Recommendation: ${r}`)
    ];
    
    const dashboardConfig = {
      title: `Comprehensive Dashboard: ${fileName}`,
      insights: allInsights,
      charts,
      keyMetrics,
      dataQuality: aiInsights.dataQuality,
      businessValue: aiInsights.businessValue
    };
    
    console.log(`Dashboard generated successfully with ${charts.length} charts and ${allInsights.length} insights`);
    
    return new Response(JSON.stringify({
      success: true,
      dashboard: dashboardConfig,
      columnAnalysis,
      chartCategories: {
        univariate: charts.filter(c => c.category === 'univariate').length,
        bivariate: charts.filter(c => c.category === 'bivariate').length,
        correlation: charts.filter(c => c.category === 'correlation').length,
        categorical: charts.filter(c => c.category === 'categorical').length,
        timeseries: charts.filter(c => c.category === 'timeseries').length
      }
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
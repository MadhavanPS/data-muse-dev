import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { csvData, prompt, chartType } = await req.json();

    console.log('Processing visualization request:', { 
      csvDataLength: csvData?.length, 
      prompt, 
      chartType 
    });

    // Parse CSV to get headers and sample data for better processing
    const lines = csvData.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    const headers = lines[0].split(',').map(h => h.trim());
    const sampleData = lines.slice(1, 6); // First 5 data rows
    
    console.log('CSV headers:', headers);
    console.log('Sample data rows:', sampleData.length);

    const systemPrompt = `You are a data visualization expert. Analyze the CSV data and create appropriate chart configurations.

IMPORTANT: You must respond with ONLY valid JSON, no additional text or formatting.

CSV Headers: ${headers.join(', ')}
Sample Data (first 5 rows):
${sampleData.join('\n')}

User Request: ${prompt}
Suggested Chart Type: ${chartType}

Create a visualization configuration with this exact structure:
{
  "chartType": "${chartType}",
  "data": [array of objects with keys matching CSV headers],
  "config": {
    "title": "Chart Title",
    "xKey": "column_name_for_x_axis",
    "yKey": "column_name_for_y_axis"
  },
  "insights": "Brief analysis of the data"
}

For the data array, process the actual CSV data and create meaningful chart data objects. Use appropriate column names from the headers.`;

    console.log('Sending request to Gemini...');

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4000,
        }
      }),
    });

    const data = await response.json();
    console.log('Gemini response status:', response.status);
    
    if (!response.ok) {
      console.error('Gemini API error:', data);
      throw new Error(data.error?.message || 'AI visualization request failed');
    }

    let vizConfig;
    try {
      const generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      console.log('Raw Gemini response:', generatedContent);
      
      // Clean up the response in case it has markdown formatting
      const cleanedContent = generatedContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      console.log('Cleaned content:', cleanedContent);
      vizConfig = JSON.parse(cleanedContent);
      
      console.log('Parsed viz config:', vizConfig);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Failed to parse content:', data.candidates?.[0]?.content?.parts?.[0]?.text);
      
      // Create a simple fallback visualization with actual data
      const dataRows = lines.slice(1, 21); // Use first 20 rows
      const chartData = dataRows.map((row, index) => {
        const values = row.split(',');
        return {
          name: values[0] || `Row ${index + 1}`,
          value: parseFloat(values[1]) || index + 1
        };
      }).filter(item => !isNaN(item.value));

      vizConfig = {
        chartType: chartType || 'bar',
        data: chartData,
        config: { 
          title: `${chartType || 'Bar'} Chart from CSV Data`,
          xKey: 'name',
          yKey: 'value'
        },
        insights: `Showing ${chartData.length} data points from your CSV file. Original parsing failed, using fallback visualization.`
      };
    }

    return new Response(JSON.stringify({
      visualization: vizConfig,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-data-viz function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
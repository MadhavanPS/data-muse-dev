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

    const systemPrompt = `You are a data visualization expert. Analyze the CSV data and create appropriate chart configurations.

Instructions:
1. Analyze the CSV data structure
2. Based on the user prompt and suggested chart type, create a chart configuration
3. Return a JSON object with:
   - chartType: "bar", "line", "pie", "scatter", etc.
   - data: processed data for the chart
   - config: chart configuration options
   - insights: brief analysis insights

CSV Data Preview (first few rows):
${csvData.split('\n').slice(0, 6).join('\n')}

User Request: ${prompt}
Suggested Chart Type: ${chartType || 'auto-detect best type'}

Respond with valid JSON only.`;

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
          temperature: 0.3,
          maxOutputTokens: 2000,
        }
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API error:', data);
      throw new Error(data.error?.message || 'AI visualization request failed');
    }

    let vizConfig;
    try {
      const generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      vizConfig = JSON.parse(generatedContent);
    } catch (parseError) {
      // Fallback if AI doesn't return proper JSON
      vizConfig = {
        chartType: chartType || 'bar',
        data: [],
        config: { title: 'Data Visualization' },
        insights: 'Unable to process data automatically. Please check data format.'
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
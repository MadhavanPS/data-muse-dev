import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Analyze the data and create visualization config.' }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      throw new Error(data.error?.message || 'AI visualization request failed');
    }

    let vizConfig;
    try {
      vizConfig = JSON.parse(data.choices[0].message.content);
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
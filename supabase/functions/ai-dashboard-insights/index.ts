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
    const { csvData, analysisType } = await req.json();

    console.log('Processing dashboard analysis:', { 
      csvDataLength: csvData?.length, 
      analysisType 
    });

    // Parse CSV to get comprehensive data structure
    const lines = csvData.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    const headers = lines[0].split(',').map(h => h.trim());
    const dataRows = lines.slice(1, 50); // Analyze first 50 rows for comprehensive insights
    
    console.log('CSV headers:', headers);
    console.log('Data rows for analysis:', dataRows.length);

    let systemPrompt = '';
    
    if (analysisType === 'templates') {
      systemPrompt = `You are a data analysis expert. Analyze this CSV data and recommend 3 dashboard templates that best suit the data characteristics.

IMPORTANT: Respond with ONLY valid JSON, no additional text.

CSV Headers: ${headers.join(', ')}
Sample Data (first 10 rows):
${dataRows.slice(0, 10).join('\n')}

Data Characteristics:
- Total columns: ${headers.length}
- Data rows: ${dataRows.length}

Analyze the data type, patterns, and structure to recommend 3 templates:

{
  "templates": [
    {
      "name": "Template Name",
      "description": "Why this template suits the data",
      "suitabilityScore": 95,
      "features": ["feature1", "feature2", "feature3"],
      "visualizations": ["chart_type1", "chart_type2"],
      "useCase": "Primary use case for this template"
    }
  ]
}`;
    } else if (analysisType === 'kpis') {
      systemPrompt = `You are a KPI expert. Analyze this CSV data and suggest the most relevant KPIs for this specific dataset.

IMPORTANT: Respond with ONLY valid JSON, no additional text.

CSV Headers: ${headers.join(', ')}
Sample Data:
${dataRows.slice(0, 10).join('\n')}

Suggest 6-8 KPIs that are most relevant to this data:

{
  "kpis": [
    {
      "name": "KPI Name",
      "description": "What this KPI measures",
      "calculation": "How to calculate it",
      "importance": "Why it's important for this data",
      "targetColumns": ["column1", "column2"],
      "category": "Performance|Quality|Efficiency|Growth"
    }
  ]
}`;
    } else if (analysisType === 'insights') {
      systemPrompt = `You are a data scientist. Perform comprehensive analysis of this CSV data and provide detailed insights.

IMPORTANT: Respond with ONLY valid JSON, no additional text.

CSV Headers: ${headers.join(', ')}
Sample Data:
${dataRows.slice(0, 15).join('\n')}

Provide comprehensive insights:

{
  "insights": {
    "dataQuality": {
      "score": 85,
      "issues": ["issue1", "issue2"],
      "recommendations": ["rec1", "rec2"]
    },
    "columnAnalysis": [
      {
        "column": "column_name",
        "dataType": "numeric|categorical|datetime",
        "insights": "Key findings about this column",
        "trends": "Observed trends or patterns",
        "recommendations": "Suggestions for this column"
      }
    ],
    "correlations": [
      {
        "columns": ["col1", "col2"],
        "strength": "strong|moderate|weak",
        "insight": "What this correlation means"
      }
    ],
    "businessInsights": [
      "Key business insight 1",
      "Key business insight 2"
    ],
    "actionableRecommendations": [
      "Specific action recommendation 1",
      "Specific action recommendation 2"
    ]
  }
}`;
    }

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
      throw new Error(data.error?.message || 'AI analysis request failed');
    }

    let analysisResult;
    try {
      const generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      console.log('Raw Gemini response:', generatedContent);
      
      const cleanedContent = generatedContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      console.log('Cleaned content:', cleanedContent);
      analysisResult = JSON.parse(cleanedContent);
      
      console.log('Parsed analysis result:', analysisResult);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      
      // Fallback response based on analysis type
      if (analysisType === 'templates') {
        analysisResult = {
          templates: [
            {
              name: "General Analytics Dashboard",
              description: "Suitable for most datasets with standard analytics needs",
              suitabilityScore: 75,
              features: ["Basic Charts", "KPI Cards", "Data Table"],
              visualizations: ["bar", "line", "pie"],
              useCase: "General data exploration and analysis"
            }
          ]
        };
      } else if (analysisType === 'kpis') {
        analysisResult = {
          kpis: [
            {
              name: "Data Completeness",
              description: "Percentage of complete records",
              calculation: "Non-null values / Total values * 100",
              importance: "Indicates data quality",
              targetColumns: headers.slice(0, 3),
              category: "Quality"
            }
          ]
        };
      } else {
        analysisResult = {
          insights: {
            dataQuality: { score: 80, issues: [], recommendations: [] },
            columnAnalysis: [],
            correlations: [],
            businessInsights: ["Analysis parsing failed, showing fallback insights"],
            actionableRecommendations: ["Please retry the analysis"]
          }
        };
      }
    }

    return new Response(JSON.stringify({
      analysis: analysisResult,
      success: true
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
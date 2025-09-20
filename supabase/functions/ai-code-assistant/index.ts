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
    const { 
      prompt, 
      context, 
      selectedText, 
      fileType, 
      requestType 
    } = await req.json();

    let systemPrompt = '';
    
    switch (requestType) {
      case 'code_generation':
        systemPrompt = `You are an expert programmer. Generate clean, efficient code based on the user's request.
Context: The user is working with ${fileType} files.
${selectedText ? `Selected code: ${selectedText}` : ''}
Provide only the code without explanations unless specifically asked.`;
        break;
      case 'code_refactor':
        systemPrompt = `You are an expert at refactoring code. Make the code more efficient, readable, and maintainable.
Context: ${fileType} file
Selected code to refactor: ${selectedText}
Provide the refactored code with brief comments explaining major changes.`;
        break;
      case 'data_analysis':
        systemPrompt = `You are a data analyst. Help analyze CSV data and generate insights.
Context: Working with CSV data files.
Provide clear, actionable insights and suggest appropriate visualizations.`;
        break;
      default:
        systemPrompt = `You are a helpful coding assistant specializing in SQL, Python, and data analysis.
Context: Working with ${fileType} files in an IDE environment.`;
    }

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
          { role: 'user', content: `${prompt}\n\nContext: ${JSON.stringify(context)}` }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      throw new Error(data.error?.message || 'AI request failed');
    }

    const generatedContent = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      content: generatedContent,
      requestType,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-code-assistant function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
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
    const {
      prompt,
      context,
      selectedText,
      fileType,
      requestType,
    } = await req.json();

    // Extract CSV context if provided by the client
    const csvData = context?.csvData || null as null | {
      filename?: string;
      content?: string;
      preview?: string;
    };

    const csvFilename = csvData?.filename || '';
    const csvContent = csvData?.content || '';
    const csvPreview = csvData?.preview || (csvContent ? csvContent.split(/\r?\n/).slice(0, 10).join('\n') : '');

    // Enhanced CSV header parser that skips comment lines and handles quotes
    function parseCsvHeader(csv: string): string[] {
      const lines = csv.split(/\r?\n/);
      let headerLine = '';
      
      // Find the first non-comment, non-empty line as the header
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#') && !trimmedLine.startsWith('//')) {
          headerLine = trimmedLine;
          break;
        }
      }
      
      if (!headerLine) return [];
      
      const cols: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < headerLine.length; i++) {
        const ch = headerLine[i];
        if (ch === '"') {
          if (inQuotes && headerLine[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === ',' && !inQuotes) {
          cols.push(cur.trim());
          cur = '';
        } else {
          cur += ch;
        }
      }
      cols.push(cur.trim());
      return cols.filter(Boolean);
    }

    const headerColumns = csvContent ? parseCsvHeader(csvContent) : [];

    const lowerPrompt = String(prompt || '').toLowerCase();
    const asksForColumns = /\bcolumns?\b|\bheaders?\b/.test(lowerPrompt) || /list .*columns?/.test(lowerPrompt);

    // Fast-path: if the user asks for columns and CSV is present, answer deterministically
    if (csvContent && asksForColumns) {
      const list = headerColumns.length ? headerColumns : ['(No header row detected)'];
      const contentStr = `Here are the columns detected from ${csvFilename || 'the uploaded CSV'}:\n- ${list.join('\n- ')}`;
      return new Response(
        JSON.stringify({ content: contentStr, requestType: 'data_analysis', success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build a stronger system prompt that explicitly surfaces CSV context
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
When CSV context is provided, always base your answers strictly on it. If the user asks for column names, list them exactly from the header.
If something is not present in the data, clearly say so.`;
        break;
      default:
        systemPrompt = `You are a helpful coding assistant specializing in SQL, Python, and data analysis.
When CSV context is provided, prefer it to answer data questions accurately.`;
    }

    const csvContextSection = csvContent
      ? `CSV CONTEXT\n- File: ${csvFilename || 'uploaded.csv'}\n- Columns (${headerColumns.length}): ${headerColumns.join(', ')}\n- Preview (first lines):\n${csvPreview}\n\nInstructions: Use this CSV context to answer the user's data questions. If the question is about columns, repeat the exact names above.`
      : '';

    // Limit context size to prevent token overflow
    const limitedContext = context ? {
      activeFile: context.activeFile,
      selectedText: context.selectedText || selectedText,
      fileType: context.fileType || fileType,
      csvData: context.csvData
    } : {};

    const contextString = JSON.stringify(limitedContext).slice(0, 10000); // Limit to 10k chars

    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': geminiApiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\n${csvContextSection}\n\nUser Request: ${prompt}\n\nIDE Context: ${contextString}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 1800,
          },
        }),
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error('Gemini API error:', data);
      throw new Error(data.error?.message || 'AI request failed');
    }

    const generatedContent =
      data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    return new Response(
      JSON.stringify({ content: generatedContent, requestType, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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
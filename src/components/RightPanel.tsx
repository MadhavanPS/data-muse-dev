import React, { useState } from 'react';
import { 
  Upload, 
  Send, 
  Paperclip, 
  CheckCircle, 
  XCircle, 
  Bot,
  User,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEditor } from '@/contexts/EditorContext';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface RightPanelProps {
  onFileUpload: (originalFile: string, originalContent: string, cleanedFile: string, cleanedContent: string) => void;
}

import { cleanDataset } from '@/utils/csvProcessing';

export const RightPanel = ({ onFileUpload }: RightPanelProps) => {
  const { activeTab, getActiveContent, getAllFilesContent, selectedText } = useEditor();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI coding assistant. I can analyze your current code and help you generate SQL queries, Python code, clean datasets, and create visualizations. What would you like to work on?',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [originalCsvContent, setOriginalCsvContent] = useState<string | null>(null);

  // CSV Processing Function
  const processCsvCleaning = (csvContent: string): string => {
    const { cleanedContent } = cleanDataset(csvContent);
    return cleanedContent;
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // Get current context for AI
    const currentContent = getActiveContent();
    const allFiles = getAllFilesContent();
    const context = {
      activeFile: activeTab?.name || '',
      currentContent,
      selectedText,
      allFiles,
      fileType: activeTab?.type || ''
    };
    
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setIsLoading(true);
    
    // TODO: Send context to AI model with CSV data awareness
    console.log('Context for AI:', context);
    
    // Enhanced AI response with CSV query capability
    setTimeout(() => {
      let aiResponse = '';
      
      // Check if user is asking about data analysis and we have CSV files
      const csvFiles = allFiles.filter(f => f.type === 'csv');
      const isDataQuery = message.toLowerCase().includes('top') || 
                         message.toLowerCase().includes('perform') ||
                         message.toLowerCase().includes('analyze') ||
                         message.toLowerCase().includes('show') ||
                         message.toLowerCase().includes('find');
      
      if (isDataQuery && csvFiles.length > 0) {
        const latestCsv = csvFiles[csvFiles.length - 1]; // Get most recent CSV
        aiResponse = `I can see you're working with data in "${latestCsv.fileName}". Based on your query "${message}", I would analyze the CSV data to find the information you're looking for. Once the ML models are integrated, I'll be able to process the actual data and provide specific insights.`;
      } else {
        aiResponse = `I can see you're working on "${activeTab?.name || 'a file'}" with ${activeTab?.type?.toUpperCase() || 'code'}. Once the AI models are integrated, I'll analyze your current code context and provide targeted assistance.`;
      }
      
      const aiResponseMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponseMsg]);
      setIsLoading(false);
    }, 1500);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadedFile(file.name);
      
      // Read and process CSV file
      const reader = new FileReader();
      reader.onload = (event) => {
        const csvContent = event.target?.result as string;
        // Store original CSV content for processing
        setOriginalCsvContent(csvContent);
      };
      reader.readAsText(file);
    }
  };

  const handleApproveFile = () => {
    if (!uploadedFile || !originalCsvContent) return;
    
    // Process the CSV through cleaning function
    const cleanedContent = processCsvCleaning(originalCsvContent);
    
    // Create new tab with cleaned data
    const cleanedFileName = uploadedFile.replace('.csv', '_cleaned.csv');
    onFileUpload(uploadedFile, originalCsvContent, cleanedFileName, cleanedContent);
    
    setUploadedFile(null);
    setOriginalCsvContent(null);
  };

  const handleRejectFile = () => {
    setUploadedFile(null);
    setOriginalCsvContent(null);
  };

  return (
    <div className="w-80 bg-panel-background border-l border-panel-border flex flex-col h-full">
      {/* File Upload Section */}
      <Card className="m-3 mb-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Dataset Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center">
            <input
              type="file"
              accept=".csv,.xlsx,.json"
              onChange={handleFileInputChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Upload className="w-6 h-6 mx-auto mb-2 opacity-50" />
              Drop CSV files here or click to browse
            </label>
          </div>
          
          {uploadedFile && (
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{uploadedFile}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                File will be cleaned and processed by our ML model
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1" 
                  onClick={handleApproveFile}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleRejectFile}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Chat Section */}
      <Card className="mx-3 mb-3 flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot className="w-4 h-4" />
            AI Assistant
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col min-h-0 space-y-3">
          {/* Messages */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-3 pr-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-message ${msg.type}`}
                >
                  <div className="flex items-start gap-2">
                    {msg.type === 'ai' ? (
                      <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="text-sm">{msg.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="chat-message ai">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">AI is thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="space-y-2">
            <Textarea
              placeholder="Ask me to generate code, clean data, or create visualizations..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="min-h-[80px] bg-input border-border text-sm resize-none"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-shrink-0">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button 
                onClick={handleSendMessage} 
                disabled={!message.trim() || isLoading}
                className="flex-1"
                size="sm"
              >
                <Send className="w-4 h-4 mr-1" />
                Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
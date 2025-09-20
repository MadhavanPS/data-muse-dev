import React, { useState } from 'react';
import { 
  Upload, 
  Send, 
  Paperclip, 
  CheckCircle, 
  XCircle, 
  Bot,
  User,
  Loader2,
  Code,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEditor } from '@/contexts/EditorContext';
import { CodeApprovalDialog } from '@/components/CodeApprovalDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface RightPanelProps {
  onFileUpload: (originalFile: string, originalContent: string, cleanedFile: string, cleanedContent: string) => void;
  onCodeUpdate: (newContent: string) => void;
}

import { cleanDataset } from '@/utils/csvProcessing';

export const RightPanel = ({ onFileUpload, onCodeUpdate }: RightPanelProps) => {
  const { toast } = useToast();
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
  
  // Code approval dialog state
  const [approvalDialog, setApprovalDialog] = useState<{
    isOpen: boolean;
    generatedCode: string;
    requestType: string;
    originalCode?: string;
  }>({
    isOpen: false,
    generatedCode: '',
    requestType: '',
    originalCode: ''
  });

  // CSV Processing Function
  const processCsvCleaning = (csvContent: string): string => {
    const { cleanedContent } = cleanDataset(csvContent);
    return cleanedContent;
  };

  const handleSendMessage = async () => {
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
    const currentMessage = message;
    setMessage('');
    setIsLoading(true);
    
    try {
      // Determine request type based on message content and context
      let requestType = 'general';
      if (currentMessage.toLowerCase().includes('generate') || currentMessage.toLowerCase().includes('create') || currentMessage.toLowerCase().includes('write')) {
        requestType = 'code_generation';
      } else if (currentMessage.toLowerCase().includes('refactor') || currentMessage.toLowerCase().includes('improve') || currentMessage.toLowerCase().includes('optimize')) {
        requestType = 'code_refactor';
      } else if (currentMessage.toLowerCase().includes('analyze') || currentMessage.toLowerCase().includes('data') || currentMessage.toLowerCase().includes('chart')) {
        requestType = 'data_analysis';
      }
      
      // Call AI assistant
      const { data, error } = await supabase.functions.invoke('ai-code-assistant', {
        body: {
          prompt: currentMessage,
          context,
          selectedText,
          fileType: activeTab?.type || '',
          requestType
        }
      });
      
      if (error) throw error;
      
      if (data.success) {
        // If it's code generation/refactoring, show approval dialog
        if (requestType === 'code_generation' || requestType === 'code_refactor') {
          setApprovalDialog({
            isOpen: true,
            generatedCode: data.content,
            requestType: data.requestType,
            originalCode: requestType === 'code_refactor' ? selectedText || currentContent : undefined
          });
        } else {
          // For other requests, just show the response
          const aiResponseMsg: Message = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: data.content,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiResponseMsg]);
        }
      } else {
        throw new Error(data.error || 'AI request failed');
      }
    } catch (error) {
      console.error('AI request error:', error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
      
      toast({
        title: "AI Request Failed",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input change triggered', e.target.files);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log('File selected:', file.name, file.type, file.size);
      
      if (!file.name.toLowerCase().endsWith('.csv') && 
          !file.name.toLowerCase().endsWith('.xlsx') && 
          !file.name.toLowerCase().endsWith('.json')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a CSV, XLSX, or JSON file.",
          variant: "destructive"
        });
        return;
      }
      
      setUploadedFile(file.name);
      
      // Read and process file
      const reader = new FileReader();
      reader.onload = (event) => {
        console.log('File read successfully');
        const content = event.target?.result as string;
        setOriginalCsvContent(content);
        
        toast({
          title: "File Loaded",
          description: `${file.name} is ready for processing`,
        });
      };
      
      reader.onerror = (error) => {
        console.error('File reading error:', error);
        toast({
          title: "File Reading Error",
          description: "Failed to read the uploaded file",
          variant: "destructive"
        });
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
  
  // Code approval handlers
  const handleApproveCode = () => {
    if (approvalDialog.generatedCode) {
      onCodeUpdate(approvalDialog.generatedCode);
      
      const successMsg: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Code has been applied successfully!',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMsg]);
      
      toast({
        title: "Code Applied",
        description: "The generated code has been inserted into your editor"
      });
    }
    
    setApprovalDialog({ isOpen: false, generatedCode: '', requestType: '', originalCode: '' });
  };
  
  const handleRejectCode = () => {
    const rejectMsg: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: 'Code suggestion rejected. Feel free to ask for modifications or try a different approach.',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, rejectMsg]);
    
    setApprovalDialog({ isOpen: false, generatedCode: '', requestType: '', originalCode: '' });
  };
  
  const closeApprovalDialog = () => {
    setApprovalDialog({ isOpen: false, generatedCode: '', requestType: '', originalCode: '' });
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
          <div className="relative">
            <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept=".csv,.xlsx,.json"
                onChange={handleFileInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                id="file-upload"
                multiple={false}
              />
              <div className="pointer-events-none">
                <Upload className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Drop CSV files here or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports CSV, XLSX, JSON files
                </p>
              </div>
            </div>
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
              placeholder={selectedText 
                ? "I can see you've selected some code. Ask me to refactor it, generate similar code, or explain it..."
                : "Ask me to generate code, clean data, or create visualizations..."
              }
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
            {selectedText && (
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                <Code className="w-3 h-3 inline mr-1" />
                Selected: {selectedText.substring(0, 50)}{selectedText.length > 50 ? '...' : ''}
              </div>
            )}
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
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-1" />
                )}
                {isLoading ? 'Processing...' : 'Send'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Approval Dialog */}
      <CodeApprovalDialog
        isOpen={approvalDialog.isOpen}
        onClose={closeApprovalDialog}
        onApprove={handleApproveCode}
        onReject={handleRejectCode}
        generatedCode={approvalDialog.generatedCode}
        requestType={approvalDialog.requestType}
        originalCode={approvalDialog.originalCode}
      />
    </div>
  );
};
import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Send, 
  Paperclip, 
  Bot,
  User,
  Loader2,
  Code,
  Sparkles,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEditor } from '@/contexts/EditorContext';
import { CodeApprovalDialog } from '@/components/CodeApprovalDialog';
import { CodeContextCard } from '@/components/CodeContextCard';
import { DiffViewer } from '@/components/DiffViewer';
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
  selectedCodeContext?: string;
  onClearCodeContext?: () => void;
  onShowInlineDiff?: (originalCode: string, newCode: string) => void;
}

import { cleanDataset } from '@/utils/csvProcessing';

export const RightPanel = ({ onFileUpload, onCodeUpdate, selectedCodeContext, onClearCodeContext, onShowInlineDiff }: RightPanelProps) => {
  const { toast } = useToast();
  const { activeTab, getActiveContent, getAllFilesContent, selectedText } = useEditor();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI coding assistant. Upload a dataset and I can help you analyze data, generate SQL queries, Python code, clean datasets, and create visualizations. What would you like to work on?',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [originalCsvContent, setOriginalCsvContent] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Code approval dialog state
  const [approvalDialog, setApprovalDialog] = useState<{
    isOpen: boolean;
    generatedCode: string;
    requestType: string;
    originalCode?: string;
    showDiff?: boolean;
  }>({
    isOpen: false,
    generatedCode: '',
    requestType: '',
    originalCode: '',
    showDiff: false
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
    
    // Include CSV data in context if available
    const csvData = originalCsvContent ? {
      filename: uploadedFile,
      content: originalCsvContent,
      preview: originalCsvContent.split('\n').slice(0, 10).join('\n') // First 10 lines
    } : null;
    
    const context = {
      activeFile: activeTab?.name || '',
      currentContent,
      selectedText,
      allFiles,
      fileType: activeTab?.type || '',
      csvData: csvData
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
        // If it's code generation/refactoring, show inline diff in editor
        if (requestType === 'code_generation' || requestType === 'code_refactor') {
          const originalCodeForDiff = requestType === 'code_refactor' ? selectedText || currentContent : currentContent;
          if (onShowInlineDiff) {
            onShowInlineDiff(originalCodeForDiff, data.content);
          }
          
          // Add a message indicating diff is showing
          const diffMsg: Message = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: `✨ I've generated ${requestType === 'code_refactor' ? 'refactored' : 'new'} code for you! Check the editor above - you'll see the changes highlighted with green (additions) and red (removals). Click **Apply** to accept the changes or **Reject** to dismiss them.`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, diffMsg]);
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
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadedFile(file.name);
      
      // Read and process CSV file
      const reader = new FileReader();
      reader.onload = (event) => {
        const csvContent = event.target?.result as string;
        // Store original CSV content and auto-process
        setOriginalCsvContent(csvContent);
        
        // Auto-process the CSV through cleaning function
        const cleanedContent = processCsvCleaning(csvContent);
        
        // Create new tab with cleaned data
        const cleanedFileName = file.name.replace('.csv', '_cleaned.csv');
        onFileUpload(file.name, csvContent, cleanedFileName, cleanedContent);
        
        // Add a message to chat indicating file was uploaded
        const fileUploadMsg: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: `📁 Dataset "${file.name}" uploaded successfully! I can now help you analyze this data, create visualizations, or generate code for data processing. What would you like to do with your dataset?`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, fileUploadMsg]);
        
        toast({
          title: "Dataset Uploaded",
          description: `${file.name} is ready for analysis`,
        });
      };
      reader.readAsText(file);
    }
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
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
    
    setApprovalDialog({ isOpen: false, generatedCode: '', requestType: '', originalCode: '', showDiff: false });
  };
  
  const handleRejectCode = () => {
    const rejectMsg: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: 'Code suggestion rejected. Feel free to ask for modifications or try a different approach.',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, rejectMsg]);
    
    setApprovalDialog({ isOpen: false, generatedCode: '', requestType: '', originalCode: '', showDiff: false });
  };
  
  const closeApprovalDialog = () => {
    setApprovalDialog({ isOpen: false, generatedCode: '', requestType: '', originalCode: '', showDiff: false });
  };

  return (
    <div className="w-80 bg-panel-background border-l border-panel-border flex flex-col h-full">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.json"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* AI Chat Section */}
      <Card className="m-3 flex-1 flex flex-col min-h-0">
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

          {/* Selected Code Context */}
          {selectedCodeContext && (
            <div className="mb-3">
              <CodeContextCard
                selectedCode={selectedCodeContext}
                fileName={activeTab?.name}
                onRemove={onClearCodeContext || (() => {})}
              />
            </div>
          )}

          {/* Message Input */}
          <div className="space-y-2">
            <Textarea
              placeholder={selectedCodeContext || selectedText 
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
            {selectedText && !selectedCodeContext && (
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                <Code className="w-3 h-3 inline mr-1" />
                Selected: {selectedText.substring(0, 50)}{selectedText.length > 50 ? '...' : ''}
              </div>
            )}
            {uploadedFile && (
              <div className="text-xs text-success bg-success/10 p-2 rounded flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Dataset: {uploadedFile}
              </div>
            )}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-shrink-0"
                onClick={handleFileUploadClick}
                title="Upload dataset"
              >
                <Upload className="w-4 h-4" />
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

      {/* Code Approval Dialog (for non-diff cases) */}
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
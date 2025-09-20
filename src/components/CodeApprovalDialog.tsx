import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, Copy, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CodeApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  generatedCode: string;
  requestType: string;
  originalCode?: string;
}

export const CodeApprovalDialog = ({
  isOpen,
  onClose,
  onApprove,
  onReject,
  generatedCode,
  requestType,
  originalCode
}: CodeApprovalDialogProps) => {
  const { toast } = useToast();
  
  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    });
  };
  
  const getDialogTitle = () => {
    switch (requestType) {
      case 'code_generation':
        return 'AI Generated Code';
      case 'code_refactor':
        return 'Code Refactoring Suggestion';
      case 'data_analysis':
        return 'Data Analysis Result';
      default:
        return 'AI Suggestion';
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            {getDialogTitle()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 space-y-4">
          {/* Original Code (if refactoring) */}
          {originalCode && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Original Code:</h4>
              <ScrollArea className="h-32 bg-muted rounded-lg">
                <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                  {originalCode}
                </pre>
              </ScrollArea>
            </div>
          )}
          
          {/* Generated/Suggested Code */}
          <div className="space-y-2 flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                {requestType === 'code_refactor' ? 'Refactored Code:' : 'Generated Code:'}
              </h4>
              <Button variant="outline" size="sm" onClick={handleCopyCode}>
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
            </div>
            <ScrollArea className="flex-1 bg-muted rounded-lg">
              <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                {generatedCode}
              </pre>
            </ScrollArea>
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onReject}>
            <XCircle className="w-4 h-4 mr-1" />
            Reject
          </Button>
          <Button onClick={onApprove}>
            <CheckCircle className="w-4 h-4 mr-1" />
            Approve & Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
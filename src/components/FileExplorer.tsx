import React, { useState } from 'react';
import { 
  Folder,
  FolderOpen,
  File,
  FileText,
  Database,
  Code,
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';

import { FileSystemItem } from '@/types/FileSystem';

interface FileExplorerProps {
  files: FileSystemItem[];
  onFileSelect: (file: FileSystemItem) => void;
  onNewFile: (type: 'sql' | 'python' | 'csv' | 'json') => void;
  onNewFolder: () => void;
}

const getFileIcon = (fileType?: string) => {
  switch (fileType) {
    case 'sql':
      return Database;
    case 'python':
      return Code;
    case 'csv':
    case 'json':
      return FileText;
    default:
      return File;
  }
};

const FileTreeItem = ({ 
  item, 
  level = 0, 
  onSelect, 
  onToggleExpand 
}: {
  item: FileSystemItem;
  level: number;
  onSelect: (item: FileSystemItem) => void;
  onToggleExpand: (id: string) => void;
}) => {
  const Icon = item.type === 'folder' 
    ? (item.isExpanded ? FolderOpen : Folder)
    : getFileIcon(item.fileType);
  
  const ChevronIcon = item.isExpanded ? ChevronDown : ChevronRight;
  
  return (
    <div className="select-none">
      <div 
        className={`flex items-center gap-1 py-1 px-2 hover:bg-muted/50 cursor-pointer text-sm group`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => item.type === 'folder' ? onToggleExpand(item.id) : onSelect(item)}
      >
        {item.type === 'folder' && (
          <ChevronIcon className="w-3 h-3 opacity-60" />
        )}
        <Icon className="w-4 h-4 opacity-60" />
        <span className="flex-1 truncate">{item.name}</span>
        {item.type === 'folder' && (
          <MoreHorizontal className="w-3 h-3 opacity-0 group-hover:opacity-60" />
        )}
      </div>
      
      {item.type === 'folder' && item.isExpanded && item.children && (
        <div>
          {item.children.map((child) => (
            <FileTreeItem
              key={child.id}
              item={child}
              level={level + 1}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileExplorer = ({ 
  files, 
  onFileSelect, 
  onNewFile, 
  onNewFolder 
}: FileExplorerProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['1']));
  
  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFolders(newExpanded);
  };
  
  const filesWithExpandState = files.map(file => ({
    ...file,
    isExpanded: expandedFolders.has(file.id),
    children: file.children?.map(child => ({
      ...child,
      isExpanded: expandedFolders.has(child.id)
    }))
  }));
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <span className="text-sm font-medium">EXPLORER</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
              <Plus className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onNewFile('sql')}>
              <Database className="w-4 h-4 mr-2" />
              New SQL File
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNewFile('python')}>
              <Code className="w-4 h-4 mr-2" />
              New Python File
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onNewFolder}>
              <Folder className="w-4 h-4 mr-2" />
              New Folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* File Tree */}
      <div className="flex-1 overflow-y-auto">
        {filesWithExpandState.map((file) => (
          <FileTreeItem
            key={file.id}
            item={file}
            level={0}
            onSelect={onFileSelect}
            onToggleExpand={toggleExpand}
          />
        ))}
        
        {files.length === 0 && (
          <div className="p-4 text-center text-muted-foreground">
            <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No files yet</p>
            <p className="text-xs">Create a new file to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};
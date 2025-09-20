import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import { FileTab } from '@/components/FileTabs';

interface EditorContextType {
  activeTab: FileTab | undefined;
  tabs: FileTab[];
  fileContents: Record<string, string>;
  getActiveContent: () => string;
  getAllFilesContent: () => { fileName: string; content: string; type: string }[];
  selectedText: string;
  cursorPosition: { line: number; column: number };
  setSelectedText: (text: string) => void;
  setCursorPosition: (position: { line: number; column: number }) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

interface EditorProviderProps {
  children: ReactNode;
  tabs: FileTab[];
  fileContents: Record<string, string>;
}

export const EditorProvider = ({ children, tabs, fileContents }: EditorProviderProps) => {
  const [selectedText, setSelectedText] = useState('');
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });

  const activeTab = useMemo(() => tabs.find(tab => tab.isActive), [tabs]);

  const getActiveContent = useCallback(() => {
    if (!activeTab) return '';
    return fileContents[activeTab.id] || '';
  }, [activeTab, fileContents]);

  const getAllFilesContent = useCallback(() => {
    return tabs.map(tab => ({
      fileName: tab.name,
      content: fileContents[tab.id] || '',
      type: tab.type
    }));
  }, [tabs, fileContents]);

  const value: EditorContextType = useMemo(() => ({
    activeTab,
    tabs,
    fileContents,
    getActiveContent,
    getAllFilesContent,
    selectedText,
    cursorPosition,
    setSelectedText,
    setCursorPosition
  }), [activeTab, tabs, fileContents, getActiveContent, getAllFilesContent, selectedText, cursorPosition]);

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};
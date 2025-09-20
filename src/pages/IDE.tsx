import React, { useState } from 'react';
import { FileTabs, FileTab } from '@/components/FileTabs';
import { LeftSidebar } from '@/components/LeftSidebar';
import { VisualizationPanel } from '@/components/VisualizationPanel';
import { RightPanel } from '@/components/RightPanel';
import { CodeEditor } from '@/components/CodeEditor';
import { EditorProvider } from '@/contexts/EditorContext';
import { useToast } from '@/hooks/use-toast';
import { FileSystemItem } from '@/types/FileSystem';

const IDE = () => {
  const { toast } = useToast();
  const [activePanel, setActivePanel] = useState('explorer');
  const [isVizFullscreen, setIsVizFullscreen] = useState(false);
  const [tabs, setTabs] = useState<FileTab[]>([
    {
      id: '1',
      name: 'welcome.sql',
      type: 'sql',
      isActive: true,
      isDirty: false
    }
  ]);
  const [fileContents, setFileContents] = useState<Record<string, string>>({
    '1': ''
  });

  // File system structure for explorer
  const [fileSystemItems, setFileSystemItems] = useState<FileSystemItem[]>([
    {
      id: '1',
      name: 'Project Files',
      type: 'folder',
      isExpanded: true,
      children: [
        { id: 'welcome-sql', name: 'welcome.sql', type: 'file', fileType: 'sql' }
      ]
    }
  ]);

  const activeTab = tabs.find(tab => tab.isActive);
  
  const handleTabClick = (id: string) => {
    setTabs(prev => prev.map(tab => ({
      ...tab,
      isActive: tab.id === id
    })));
  };

  const handleTabClose = (id: string) => {
    const tabToClose = tabs.find(t => t.id === id);
    if (tabToClose?.isDirty) {
      toast({
        title: "Unsaved Changes",
        description: "Please save your changes before closing the file.",
        variant: "destructive"
      });
      return;
    }

    const newTabs = tabs.filter(tab => tab.id !== id);
    if (newTabs.length === 0) {
      // Keep at least one tab open
      return;
    }
    
    if (tabToClose?.isActive && newTabs.length > 0) {
      newTabs[0].isActive = true;
    }
    
    setTabs(newTabs);
    
    // Remove content
    const newContents = { ...fileContents };
    delete newContents[id];
    setFileContents(newContents);
  };

  const handleNewFile = (type: 'sql' | 'python' | 'csv' | 'json') => {
    const newId = Date.now().toString();
    const extension = type === 'sql' ? 'sql' : type === 'python' ? 'py' : type === 'json' ? 'json' : 'csv';
    const newTab: FileTab = {
      id: newId,
      name: `untitled.${extension}`,
      type,
      isActive: true,
      isDirty: false
    };

    setTabs(prev => [
      ...prev.map(tab => ({ ...tab, isActive: false })),
      newTab
    ]);
    
    setFileContents(prev => ({
      ...prev,
      [newId]: ''
    }));

    // Add to file system
    setFileSystemItems(prev => {
      const updatedItems = [...prev];
      const projectFolder = updatedItems.find(item => item.name === 'Project Files');
      if (projectFolder && projectFolder.children) {
        projectFolder.children.push({
          id: newId,
          name: `untitled.${extension}`,
          type: 'file',
          fileType: type
        });
      }
      return updatedItems;
    });
  };

  const handleContentChange = (content: string) => {
    if (!activeTab) return;
    
    setFileContents(prev => ({
      ...prev,
      [activeTab.id]: content
    }));
    
    // Mark as dirty if content changed
    setTabs(prev => prev.map(tab => 
      tab.id === activeTab.id 
        ? { ...tab, isDirty: true }
        : tab
    ));
  };

  const handleSave = () => {
    if (!activeTab) return;
    
    setTabs(prev => prev.map(tab => 
      tab.id === activeTab.id 
        ? { ...tab, isDirty: false }
        : tab
    ));
    
    toast({
      title: "File Saved",
      description: `${activeTab.name} has been saved successfully.`
    });
  };

  const handleRun = () => {
    if (!activeTab) return;
    
    toast({
      title: "Code Execution",
      description: `Running ${activeTab.type.toUpperCase()} code... (Integration pending)`
    });
  };

  const handleFileUpload = (originalFile: string, originalContent: string, cleanedFile: string, cleanedContent: string) => {
    // Create tabs for both original and cleaned files
    const originalId = Date.now().toString();
    const cleanedId = (Date.now() + 1).toString();
    
    const originalTab: FileTab = {
      id: originalId,
      name: originalFile,
      type: 'csv',
      isActive: false,
      isDirty: false
    };
    
    const cleanedTab: FileTab = {
      id: cleanedId,
      name: cleanedFile,
      type: 'csv',
      isActive: true,
      isDirty: false
    };
    
    setTabs(prev => [
      ...prev.map(tab => ({ ...tab, isActive: false })),
      originalTab,
      cleanedTab
    ]);
    
    setFileContents(prev => ({
      ...prev,
      [originalId]: originalContent,
      [cleanedId]: cleanedContent
    }));

    // Add to file system
    setFileSystemItems(prev => {
      const updatedItems = [...prev];
      const projectFolder = updatedItems.find(item => item.name === 'Project Files');
      if (projectFolder && projectFolder.children) {
        projectFolder.children.push(
          { id: originalId, name: originalFile, type: 'file', fileType: 'csv' },
          { id: cleanedId, name: cleanedFile, type: 'file', fileType: 'csv' }
        );
      }
      return updatedItems;
    });
    
    toast({
      title: "Dataset Processed",
      description: `${cleanedFile} created and opened. Original file also available in tabs.`
    });
  };

  const handleCodeUpdate = (newContent: string) => {
    if (!activeTab) return;
    
    setFileContents(prev => ({
      ...prev,
      [activeTab.id]: newContent
    }));
    
    setTabs(prev => prev.map(tab => 
      tab.id === activeTab.id 
        ? { ...tab, isDirty: true }
        : tab
    ));
  };

  const handleFileSelect = (file: FileSystemItem) => {
    // Find existing tab or create new one
    const existingTab = tabs.find(tab => tab.name === file.name);
    if (existingTab) {
      handleTabClick(existingTab.id);
    } else if (file.type === 'file') {
      // Create new tab for this file
      const newTab: FileTab = {
        id: file.id,
        name: file.name,
        type: file.fileType || 'sql',
        isActive: true,
        isDirty: false
      };
      
      setTabs(prev => [
        ...prev.map(tab => ({ ...tab, isActive: false })),
        newTab
      ]);
      
      // Load file content (placeholder for now)
      setFileContents(prev => ({
        ...prev,
        [file.id]: fileContents[file.id] || ''
      }));
    }
  };

  const handleNewFolder = () => {
    const folderId = Date.now().toString();
    setFileSystemItems(prev => [
      ...prev,
      {
        id: folderId,
        name: 'New Folder',
        type: 'folder',
        isExpanded: false,
        children: []
      }
    ]);
  };

  return (
    <EditorProvider tabs={tabs} fileContents={fileContents}>
      <div className="h-screen bg-background text-foreground flex flex-col">
        {/* File Tabs */}
        <FileTabs
          tabs={tabs}
          onTabClick={handleTabClick}
          onTabClose={handleTabClose}
          onNewFile={handleNewFile}
        />

        {/* Main Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <LeftSidebar 
            activePanel={activePanel} 
            onPanelChange={setActivePanel}
            files={fileSystemItems}
            onFileSelect={handleFileSelect}
            onNewFile={handleNewFile}
            onNewFolder={handleNewFolder}
          />

          {/* Central Content Area */}
          <div className="flex-1 flex min-w-0">
            {/* Visualization Panel */}
            <div className="w-80 border-r border-panel-border bg-panel-background flex-shrink-0">
              <VisualizationPanel 
                isFullscreen={isVizFullscreen}
                onToggleFullscreen={() => setIsVizFullscreen(!isVizFullscreen)}
              />
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-editor-background">
              {activeTab && (
                <CodeEditor
                  activeFile={activeTab.name}
                  language={activeTab.type}
                  content={fileContents[activeTab.id] || ''}
                  onChange={handleContentChange}
                  onSave={handleSave}
                  onRun={handleRun}
                />
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-80 border-l border-panel-border bg-panel-background flex-shrink-0">
            <RightPanel 
              onFileUpload={handleFileUpload}
              onCodeUpdate={handleCodeUpdate}
            />
          </div>
        </div>

        {/* Fullscreen Visualization Overlay */}
        {isVizFullscreen && (
          <div className="fixed inset-0 z-50 bg-background">
            <VisualizationPanel 
              isFullscreen={true}
              onToggleFullscreen={() => setIsVizFullscreen(false)}
            />
          </div>
        )}
      </div>
    </EditorProvider>
  );
};

export default IDE;

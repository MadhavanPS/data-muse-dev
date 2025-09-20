import React, { useState } from 'react';
import { FileTabs, FileTab } from '@/components/FileTabs';
import { LeftSidebar } from '@/components/LeftSidebar';
import { VisualizationPanel } from '@/components/VisualizationPanel';
import { RightPanel } from '@/components/RightPanel';
import { CodeEditor } from '@/components/CodeEditor';
import { EditorProvider } from '@/contexts/EditorContext';
import { useToast } from '@/hooks/use-toast';

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

  const handleNewFile = (type: 'sql' | 'python') => {
    const newId = Date.now().toString();
    const extension = type === 'sql' ? 'sql' : 'py';
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

  const handleFileUpload = (files: FileList) => {
    toast({
      title: "File Uploaded",
      description: "Dataset uploaded and will be processed for cleaning."
    });
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
          />

          {/* Visualization Panel */}
          <div className="w-80 border-r border-panel-border bg-panel-background">
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

          {/* Right Panel */}
          <RightPanel onFileUpload={handleFileUpload} />
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

# AI/ML Model Integration Guide

## Overview
This IDE is built to integrate with your custom AI/ML models for three main functionalities:

1. **Code Generation & Assistance** - Chatbot that understands current code context
2. **Dataset Cleaning** - ML model for automated data preprocessing
3. **Dashboard Generation** - ML model for creating visualizations from data

## Current Implementation

### Editor Context System
The IDE includes a comprehensive context system (`src/contexts/EditorContext.tsx`) that provides:

- **Active file content** - Current code being edited
- **All open files** - Content from all tabs
- **Selected text** - Currently highlighted code
- **Cursor position** - Line and column information
- **File types** - SQL or Python context

### Integration Points

#### 1. Code Generation Chatbot (`src/components/RightPanel.tsx`)

**Current Function:** `handleSendMessage()`
**Context Available:**
```javascript
const context = {
  activeFile: activeTab?.name || '',
  currentContent: getActiveContent(),
  selectedText: selectedText,
  allFiles: getAllFilesContent(),
  fileType: activeTab?.type || ''
};
```

**Integration Options:**

**Option A: API Integration**
```javascript
// Replace the setTimeout simulation with:
const response = await fetch('/api/ai/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: message,
    context: context
  })
});
const result = await response.json();
```

**Option B: WebSocket for Real-time**
```javascript
// For streaming responses
const ws = new WebSocket('ws://your-ai-service/stream');
ws.send(JSON.stringify({ message, context }));
```

#### 2. Dataset Cleaning (`src/components/RightPanel.tsx`)

**Current Function:** `handleFileInputChange()` and approval workflow

**Integration Point:**
```javascript
// In handleApproveFile() function
const cleanDataset = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/ml/clean-dataset', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
};
```

#### 3. Dashboard Generation (`src/components/VisualizationPanel.tsx`)

**Current State:** Basic chart type selection UI
**Integration Needed:** Connect to your ML model that generates matplotlib visualizations

```javascript
// Add to VisualizationPanel
const generateDashboard = async (data, prompt) => {
  const response = await fetch('/api/ml/generate-dashboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: data,
      prompt: prompt,
      chartTypes: ['bar', 'line', 'scatter'] // from UI selection
    })
  });
  
  return await response.json(); // Returns matplotlib figure or base64 image
};
```

## Recommended Integration Approaches

### 1. **Backend API Approach (Recommended)**
Create a backend service (Python Flask/FastAPI) that:
- Hosts your ML models
- Provides REST endpoints
- Handles file uploads and processing
- Returns processed results

### 2. **Direct Model Integration**
- Use WebAssembly (WASM) to run models in browser
- Limited by model size and browser capabilities

### 3. **External Service Integration**
- Cloud ML services (AWS SageMaker, Google AI Platform)
- Custom Docker containers
- Serverless functions

## File Structure for Models

Suggested backend structure:
```
/backend
  /models
    - code_generator.py    # Your NLP model
    - dataset_cleaner.py   # Data preprocessing model
    - viz_generator.py     # Dashboard creation model
  /api
    - routes.py           # API endpoints
    - context_processor.py # Handle IDE context
  - requirements.txt
  - main.py
```

## Environment Variables

Add to your deployment:
```env
AI_MODEL_API_URL=http://your-ai-service:8000
ML_PROCESSING_ENDPOINT=http://your-ml-service:8000
DASHBOARD_GENERATOR_URL=http://your-viz-service:8000
```

## Testing Integration

The IDE includes mock responses that simulate your models. Replace these with actual API calls:

1. **Code Chat**: Look for `TODO: Send context to AI model` in RightPanel.tsx
2. **File Cleaning**: Check `handleApproveFile()` function
3. **Visualization**: Update `generateChart()` in VisualizationPanel.tsx

## Security Considerations

- Validate all file uploads
- Sanitize user inputs before sending to models
- Implement rate limiting
- Use HTTPS for all API communications
- Consider implementing API keys/authentication

## Next Steps

1. Choose your integration approach
2. Set up backend services
3. Replace mock functions with actual API calls
4. Test with sample data
5. Deploy and configure production environment

The IDE is fully prepared for your AI/ML integration with comprehensive context awareness and clean separation between UI and model logic.
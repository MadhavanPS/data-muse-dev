export interface FileSystemItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  fileType?: 'sql' | 'python' | 'csv' | 'json';
  children?: FileSystemItem[];
  isExpanded?: boolean;
}
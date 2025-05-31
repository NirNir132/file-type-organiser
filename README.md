# Advanced Folder Visualizer

A powerful, client-side web application that allows you to drag & drop folders,
visualize their structure in a tree view, apply advanced filters, and download
organized collections. All processing happens locally in your browser for
privacy and security.

## 🚀 Features

### 📁 Folder Tree Visualization

- **Interactive Tree View**: Explore folder structures with
  expandable/collapsible nodes
- **File Type Icons**: Visual identification of different file types (images,
  documents, audio, video, code, etc.)
- **File Information**: See file sizes and organize by hierarchy
- **Checkbox Selection**: Select individual files or entire folders for download

### 🔍 Advanced Filtering & Search

- **Real-time Search**: Search files and folders by name or path
- **File Type Filters**: Quick filters for common file types (Documents, Images,
  Audio, Video, Archives, Code)
- **Custom Extensions**: Add custom file extensions for specialized filtering
- **Size Filtering**: Filter files by size range (min/max in KB)
- **Date Filtering**: Filter files by modification date range
- **Multiple Filter Combinations**: Apply multiple filters simultaneously

### 📊 Folder Statistics

- **File Count**: Total files and folders in the uploaded structure
- **Size Analysis**: Total size with human-readable formatting
- **Type Distribution**: Visual breakdown of file types with percentages
- **Real-time Updates**: Statistics update as you apply filters

### 💾 Smart Download Options

- **Filtered Downloads**: Download only files matching your current filters
- **Selected Downloads**: Download specific files/folders you've selected
- **Preserved Structure**: ZIP files maintain original folder hierarchy
- **Custom Naming**: Automatic ZIP naming based on filters or selection

### 🎨 Modern UI/UX

- **Two View Modes**: Switch between Tree view and List view
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Clean Interface**: Minimalist design focused on usability
- **Real-time Feedback**: Loading states and progress indicators

## 🛠️ Technology Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **JSZip** for archive creation
- **File System Access API** for folder reading

## 🔒 Privacy & Security

- **100% Client-Side**: No files are uploaded to any server
- **Local Processing**: All operations happen in your browser
- **No Data Storage**: Files are not stored or cached
- **Open Source**: Full transparency of code and operations

## 🚀 Quick Start

1. **Drag & Drop**: Simply drag a folder from your computer onto the drop zone
2. **Explore**: Use the tree view to navigate the folder structure
3. **Filter**: Apply search terms and file type filters to find specific files
4. **Select**: Choose individual files or entire folders using checkboxes
5. **Download**: Click the download button to get a ZIP with your selection

## 🎯 Use Cases

### Business & Professional

- **Document Organization**: Extract all PDFs, Word docs, and spreadsheets from
  mixed folders
- **Project Management**: Organize project files by type for better structure
- **Compliance**: Quickly gather specific document types for audits
- **Email Attachments**: Sort through downloaded email attachment folders

### Personal & Creative

- **Photo Organization**: Extract all images from nested folder structures
- **Media Management**: Separate audio and video files from other content
- **Archive Cleanup**: Find and organize files in old backup folders
- **Development**: Extract source code files from complex project structures

### Content Creation

- **Asset Management**: Organize design assets by file type
- **Backup Organization**: Structure backups by content type
- **Migration Tasks**: Prepare files for moving between systems

## 🔧 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🌐 Live Demo

Visit [organisefiles.live](https://organisefiles.live) to try it out!

---

Made with ❤️ for better file organization

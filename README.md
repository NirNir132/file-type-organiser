# 📁 Advanced File Type Organizer & Converter

A powerful, browser-based tool for organizing files and converting between
different formats. Features an intuitive drag-and-drop interface, advanced
filtering capabilities, and high-quality document conversion powered by modern
web technologies.

## ✨ Features

### 🗂️ File Organization

- **Smart Folder Analysis**: Visualize folder structures with interactive tree
  views
- **Advanced Filtering**: Search by filename, filter by file types, size ranges,
  and dates
- **Batch Operations**: Select multiple files or entire folders for bulk actions
- **ZIP Download**: Create organized ZIP archives of selected files
- **Real-time Statistics**: View comprehensive folder stats and file type
  distributions

### 🔄 Document Conversion

Enhanced with production-quality conversion capabilities:

#### **PDF ↔ DOCX Conversion**

- **PDF to DOCX**: Advanced text extraction with layout preservation

  - Uses PDF.js for high-quality text extraction
  - Intelligent paragraph detection and heading recognition
  - Maintains document structure and formatting
  - Proper DOCX document creation with margins and styling

- **DOCX to PDF**: Professional-grade PDF generation
  - Full formatting preservation including headings, bold, italic
  - HTML5 canvas rendering for pixel-perfect conversion
  - Proper page layout with A4 formatting
  - Multi-page document support

#### **Additional Conversions**

- **Text ↔ PDF/DOCX**: Clean conversion with proper formatting
- **PDF to Images**: High-resolution page rendering (PNG/JPG)
- **Image Formats**: Support for JPEG, PNG, WebP, HEIC, SVG, and more
- **Audio/Video**: FFmpeg-powered media conversion
- **Spreadsheets**: Excel, CSV, ODS format support

### 🛠️ Technical Features

- **Client-Side Processing**: All conversions happen locally - no server uploads
- **Progressive Web App**: Works offline with service worker caching
- **WebAssembly Performance**: Leverages WASM for complex document processing
- **Real-time Progress**: Detailed conversion progress with stage indicators
- **Error Handling**: Comprehensive error recovery and user feedback
- **Memory Efficient**: Streaming processing for large files

## 🚀 Technologies Used

### Core Framework

- **React 19** with TypeScript
- **Vite** for lightning-fast development
- **Tailwind CSS** for modern, responsive UI

### Document Processing

- **PDF.js** - Mozilla's PDF rendering engine for text extraction
- **Mammoth.js** - Microsoft Word document processing
- **docx** - Professional DOCX document creation
- **jsPDF** - Client-side PDF generation
- **html2canvas** - HTML to image conversion

### Media & File Processing

- **FFmpeg.wasm** - Video/audio conversion in the browser
- **JSZip** - Archive creation and extraction
- **heic2any** - HEIC image format support
- **XLSX** - Spreadsheet processing

## 📋 Installation & Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/file-type-organizer.git
cd file-type-organizer

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🎯 Usage

### File Organization Mode

1. **Drag & Drop**: Drop folders directly into the application
2. **Browse Structure**: Explore files using the interactive tree view
3. **Apply Filters**: Use the sidebar to filter by type, size, or search terms
4. **Select Files**: Choose individual files or entire folders
5. **Download ZIP**: Export your selection as an organized archive

### File Conversion Mode

1. **Select File**: Choose from supported formats (PDF, DOCX, images, etc.)
2. **Pick Target Format**: Select your desired output format
3. **Configure Options**: Adjust quality, dimensions, or other settings
4. **Convert**: Watch real-time progress as conversion happens
5. **Download**: Get your converted file instantly

## 📊 Supported Conversions

| Source Format    | Target Formats       | Quality Level         |
| ---------------- | -------------------- | --------------------- |
| **PDF**          | DOCX, TXT, JPG, PNG  | ⭐⭐⭐⭐⭐ Production |
| **DOCX/DOC**     | PDF, TXT             | ⭐⭐⭐⭐⭐ Production |
| **Images**       | JPG, PNG, WebP, HEIC | ⭐⭐⭐⭐⭐ Production |
| **Audio**        | MP3, WAV, OGG, FLAC  | ⭐⭐⭐⭐ High Quality |
| **Video**        | MP4, AVI, WebM, MOV  | ⭐⭐⭐⭐ High Quality |
| **Spreadsheets** | XLSX, CSV, ODS       | ⭐⭐⭐⭐ High Quality |

## 🔒 Privacy & Security

- **100% Client-Side**: No files ever leave your device
- **No Server Upload**: All processing happens in your browser
- **Memory Safe**: Automatic cleanup after processing
- **Secure Origins**: HTTPS required for service worker features

## 🌟 Advanced Features

### Document Conversion Highlights

- **Intelligent Layout Detection**: Automatically identifies headings and
  paragraphs
- **Font Handling**: Proper font substitution for cross-platform compatibility
- **Multi-page Support**: Handles documents of any length
- **Format Preservation**: Maintains bold, italic, and other text formatting
- **Professional Output**: A4 page layout with proper margins

### Performance Optimizations

- **Lazy Loading**: Libraries loaded only when needed
- **Streaming Processing**: Memory-efficient handling of large files
- **Progressive Rendering**: Real-time progress feedback
- **Error Recovery**: Graceful handling of corrupt or unsupported files

## 🛠️ Development

### Project Structure

```
src/
├── components/          # React components
│   ├── FileConverter.tsx    # Main conversion interface
│   ├── DropZone.tsx        # File upload area
│   └── FolderTree.tsx      # File tree visualization
├── services/           # Core business logic
│   ├── converters/         # Format-specific converters
│   │   ├── documentConverter.ts  # PDF/DOCX conversion
│   │   ├── imageConverter.ts     # Image processing
│   │   └── mediaConverter.ts     # Audio/video conversion
│   └── fileService.ts      # File analysis utilities
└── types.ts           # TypeScript definitions
```

### Adding New Converters

1. Create converter in `src/services/converters/`
2. Import and register in main conversion service
3. Add supported formats to conversion categories
4. Implement progress reporting and error handling

## 📝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open
issues for bugs and feature requests.

### Development Guidelines

- Follow TypeScript best practices
- Implement proper error handling
- Add progress reporting for long operations
- Test with various file types and sizes
- Maintain client-side only processing

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## 🙏 Acknowledgments

- **Mozilla PDF.js** team for excellent PDF processing
- **Microsoft** for the Mammoth.js DOCX library
- **FFmpeg** team for making media conversion possible in browsers
- **Open source community** for all the amazing libraries that make this
  possible

---

**Built with ❤️ using modern web technologies for fast, secure, client-side file
processing.**

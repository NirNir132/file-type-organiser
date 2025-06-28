# Manual Testing Guide for File Type Organizer

This document provides step-by-step instructions for manually testing the
various features of the File Type Organizer application.

## Table of Contents

- [File Organizer Testing](#file-organizer-testing)
- [File Converter Testing](#file-converter-testing)
- [Document Intelligence Testing](#document-intelligence-testing)

## File Organizer Testing

1. **Basic Folder Upload**

   - Navigate to the File Organizer tab
   - Drag and drop a folder containing various file types
   - Verify that the folder structure is displayed correctly
   - Verify that file counts and sizes are accurate

2. **Filtering**

   - Upload a folder with various file types
   - Use the search box to filter by filename
   - Apply file type filters (e.g., documents, images)
   - Verify that the filtered results are correct

3. **Download**
   - Upload a folder with various files
   - Select specific files or folders
   - Click the Download button
   - Verify that the downloaded ZIP contains the selected files with the correct
     structure

## File Converter Testing

1. **Image Conversion**

   - Navigate to the File Converter tab
   - Upload an image file (e.g., PNG, JPG)
   - Select a target format (e.g., convert PNG to JPG)
   - Click Convert
   - Verify that the converted file downloads and can be opened correctly

2. **Document Conversion**

   - Upload a document file (e.g., DOCX)
   - Select a target format (e.g., convert DOCX to PDF)
   - Click Convert
   - Verify that the converted file downloads and can be opened correctly

3. **Error Handling**
   - Try to convert an unsupported file type
   - Verify that an appropriate error message is displayed
   - Try to convert to an unsupported target format
   - Verify that invalid options are disabled or show warnings

## Document Intelligence Testing

1. **Generate Test Files**

   - Navigate to the Document Intelligence tab
   - Scroll down to the Test Files Generator section
   - Click "Generate Sample PDF" button
   - Verify that a PDF file is downloaded
   - Click "Generate Sample DOCX" button
   - Verify that a DOCX file is downloaded
   - Click "Generate Sample Image" button
   - Verify that a PNG image is downloaded

2. **PDF Processing**

   - Navigate to the Document Intelligence tab
   - Upload the sample PDF file (or any other PDF)
   - Click "Process Document"
   - Verify that the document is processed successfully
   - Check that the extracted text is displayed correctly
   - Verify that headings are identified correctly
   - Check that tables are extracted and displayed properly
   - Test the "Download JSON" button and verify the downloaded data

3. **DOCX Processing**

   - Upload the sample DOCX file (or any other DOCX)
   - Click "Process Document"
   - Verify that the document is processed successfully
   - Check that the extracted text is displayed correctly
   - Verify that formatting is preserved where possible
   - Check that tables are extracted and displayed properly
   - Test the "Download JSON" button and verify the downloaded data

4. **Image Processing**

   - Upload the sample image file (or any other image with text)
   - Click "Process Document"
   - Verify that the document is processed successfully
   - Check that the text is extracted correctly via OCR
   - Test the "Download JSON" button and verify the downloaded data

5. **Error Handling**

   - Try to upload an unsupported file type (e.g., audio file)
   - Verify that an appropriate error message is displayed
   - Try to upload a corrupted document
   - Verify that error handling works correctly
   - Try to process a very large document
   - Verify that performance is acceptable or appropriate warnings are shown

6. **Browser Compatibility**

   - Test the Document Intelligence feature in different browsers (Chrome,
     Firefox, Safari, Edge)
   - Verify that the feature works consistently across browsers

7. **Responsive Design**
   - Test the Document Intelligence feature on different screen sizes (desktop,
     tablet, mobile)
   - Verify that the UI adapts correctly to different screen sizes
   - Check that all functionality is accessible on mobile devices

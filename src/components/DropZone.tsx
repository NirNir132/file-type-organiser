import React, { useState, useCallback } from 'react';
import { processDroppedItems } from '../services/fileService';
import FolderIcon from './icons/FolderIcon'; // Assuming FolderIcon is fine, or use a Lucide icon
import { UploadCloud } from 'lucide-react';


interface DropZoneProps {
  onFilesScanned: (files: File[]) => void;
  setAppIsLoading: (isLoading: boolean) => void;
  setAppError: (error: string | null) => void;
}

const DropZone: React.FC<DropZoneProps> = ({ onFilesScanned, setAppIsLoading, setAppError }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    // Check if relatedTarget is null or outside the dropzone to prevent flicker
     if (event.dataTransfer.types.includes('Files') && !event.currentTarget.contains(event.relatedTarget as Node)) {
        setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
        setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.types.includes('Files') && !isDragging) {
      setIsDragging(true);
    }
  }, [isDragging]);

  const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    
    if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
      setAppIsLoading(true);
      setAppError(null);
      try {
        const files = await processDroppedItems(event.dataTransfer.items);
        if (files.length === 0 && event.dataTransfer.items[0]?.webkitGetAsEntry()?.isFile) {
           setAppError("Only folders can be dropped. Please drop a folder, not individual files.");
           onFilesScanned([]);
        } else if (files.length === 0) {
           setAppError("No files found in the dropped folder or could not access folder contents. Please try a different folder.");
           onFilesScanned([]);
        }
        else {
            onFilesScanned(files);
        }
      } catch (error) {
        console.error("Error processing dropped items:", error);
        setAppError("Failed to process dropped folder. Ensure it's a valid folder and try again. Check console for details.");
        onFilesScanned([]);
      } finally {
        setAppIsLoading(false);
      }
    } else {
      setAppError("Your browser doesn't support folder dropping in this way, or the dropped item was not a folder. Try a different browser or method.");
      onFilesScanned([]);
      setAppIsLoading(false);
    }
  }, [onFilesScanned, setAppIsLoading, setAppError]);

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`group w-full p-8 sm:p-12 border-2 rounded-2xl text-center cursor-pointer transition-all duration-300 ease-in-out 
      ${
        isDragging 
          ? 'border-solid border-sky-500 bg-sky-100/80 backdrop-blur-sm ring-4 ring-sky-500/40 shadow-2xl scale-[1.03]' 
          : 'border-dashed border-slate-400/70 bg-white/70 backdrop-blur-sm hover:border-sky-500/90 hover:bg-sky-50/70 shadow-xl hover:shadow-xl transform hover:scale-[1.01]'
      }`}
      role="button"
      aria-label="Folder drop zone"
      tabIndex={0} 
    >
      <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
        <UploadCloud 
          className={`w-20 h-20 sm:w-24 sm:h-24 transition-all duration-300 ease-in-out ${
            isDragging ? 'text-sky-600 scale-110' : 'text-slate-400 group-hover:text-sky-500'
          }`} 
          strokeWidth={1.5}
        />
        <p className={`text-lg sm:text-xl font-semibold transition-colors duration-300 ease-in-out ${
          isDragging ? 'text-sky-700' : 'text-slate-700/90 group-hover:text-sky-600'
        }`}>
          {isDragging ? "Release to Scan Folder!" : "Drag & Drop Folder Here"}
        </p>
        <p className={`text-sm sm:text-base transition-colors duration-300 ease-in-out ${
          isDragging ? 'text-sky-600/90' : 'text-slate-500/80 group-hover:text-sky-500/90'
        }`}>
          We'll scan its contents, including subfolders, to find your files.
        </p>
      </div>
    </div>
  );
};

export default DropZone;
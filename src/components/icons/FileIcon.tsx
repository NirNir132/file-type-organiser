
import React from 'react';

interface FileIconProps {
  className?: string;
}

const FileIcon: React.FC<FileIconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className || "w-6 h-6"}
  >
    <path d="M11.25 0v5.625h5.625v12.75a3.75 3.75 0 0 1-3.75 3.75h-9.75A3.75 3.75 0 0 1 0 18.375V3.75A3.75 3.75 0 0 1 3.75 0h7.5ZM12.75 0h.375a3.375 3.375 0 0 1 3.375 3.375v.375h-3.75V0Z" />
  </svg>
);

export default FileIcon;
    
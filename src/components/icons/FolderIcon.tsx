
import React from 'react';

interface FolderIconProps {
  className?: string;
}

const FolderIcon: React.FC<FolderIconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className || "w-6 h-6"}
  >
    <path d="M19.5 21a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3h-5.25a3 3 0 0 1-2.65-1.5L9.75 3H4.5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h15Z" />
  </svg>
);

export default FolderIcon;
    
import React from 'react';
import { AppFile } from '../types';
import FileIcon from './icons/FileIcon'; // Or use Lucide's FileText
import SpinnerIcon from './icons/SpinnerIcon';
import { FolderSearch, DownloadCloud } from 'lucide-react';

interface FileListProps {
  files: AppFile[];
  onDownloadZip: () => void;
  isZipping: boolean;
  targetExtension: string;
}

const FileList: React.FC<FileListProps> = ({ files, onDownloadZip, isZipping, targetExtension }) => {
  if (!targetExtension && files.length === 0) {
    return null;
  }
  
  if (files.length === 0 && targetExtension) {
     return (
        <div className="w-full p-6 sm:p-8 bg-white/80 backdrop-blur-md shadow-2xl rounded-2xl mt-8 text-center">
          <FolderSearch className="w-20 h-20 text-slate-400/80 mx-auto mb-5" strokeWidth={1.5} />
          <h3 className="text-xl font-semibold text-slate-700/90 mb-2">No Files Found</h3>
          <p className="text-slate-500/90">
            We couldn't find any files matching the extension <span className="font-semibold text-sky-600">".{targetExtension}"</span>.
          </p>
          <p className="text-sm text-slate-400/80 mt-2">Try a different extension or drop a new folder.</p>
        </div>
     );
  }


  return (
    <div className="w-full p-6 sm:p-8 bg-white/80 backdrop-blur-md shadow-2xl rounded-2xl mt-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 pb-4 border-b border-slate-200/70">
        <h3 className="text-2xl font-semibold text-slate-800/95 mb-3 sm:mb-0">
          Found <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">{files.length}</span> file(s)
          {targetExtension && <> matching <span className="font-bold text-sky-600">".{targetExtension}"</span></>}
        </h3>
        <button
          onClick={onDownloadZip}
          disabled={isZipping || files.length === 0}
          className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-500 via-green-600 to-teal-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500/70 focus:ring-offset-2 focus:ring-offset-emerald-50 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 ease-in-out flex items-center justify-center"
          aria-live="polite"
        >
          {isZipping ? (
            <>
              <SpinnerIcon className="w-5 h-5 mr-2 text-white" />
              Zipping Files...
            </>
          ) : (
            <>
              <DownloadCloud size={18} className="mr-2" />
              Download ZIP
            </>
          )}
        </button>
      </div>
      
      {files.length > 0 && (
        <div className="max-h-[26rem] overflow-y-auto -mr-2 pr-2 custom-scrollbar">
          <ul role="list" className="divide-y divide-slate-200/60">
            {files.map((file, index) => (
              <li 
                key={`${file.name}-${index}-${file.lastModified}-${file.size}`} 
                className="py-3.5 px-3 flex items-center space-x-4 hover:bg-sky-100/70 rounded-lg transition-colors duration-150 ease-in-out"
                role="listitem"
              >
                <FileIcon className="w-7 h-7 text-sky-500 flex-shrink-0" />
                <div className="flex-grow min-w-0">
                  <span className="text-sm font-medium text-slate-800/90 truncate block" title={file.name}>
                    {file.name}
                  </span>
                  <span className="text-xs text-slate-500/80">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileList;
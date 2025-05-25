import React from 'react';
import SpinnerIcon from './icons/SpinnerIcon';
import { Search } from 'lucide-react';

interface FileFilterProps {
  targetExtension: string;
  setTargetExtension: (ext: string) => void;
  onProcess: () => void;
  isProcessingDisabled: boolean;
  totalFilesScanned: number;
  isProcessing: boolean;
}

const FileFilter: React.FC<FileFilterProps> = ({
  targetExtension,
  setTargetExtension,
  onProcess,
  isProcessingDisabled,
  totalFilesScanned,
  isProcessing,
}) => {
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTargetExtension(event.target.value.replace(/^\./, '').toLowerCase().replace(/[^a-z0-9]/g, ''));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isProcessingDisabled && !isProcessing && targetExtension.trim()){
       onProcess();
    }
  }

  return (
    <div className="w-full p-6 sm:p-8 bg-white/80 backdrop-blur-md shadow-2xl rounded-2xl">
      <h2 className="text-2xl font-semibold text-slate-800/95 mb-2">Filter Your Files</h2>
      <p className="text-slate-600/90 mb-6">
        Specify the type of files you're looking for (e.g., pdf, txt, jpg).
      </p>
      
      {totalFilesScanned > 0 && (
        <div className="text-sm text-slate-700 mb-5 bg-sky-100/70 p-3.5 rounded-lg border border-sky-200/80 shadow-sm">
          Successfully scanned <span className="font-bold text-sky-700">{totalFilesScanned}</span> files from the dropped folder(s).
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row sm:items-end space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex-grow">
          <label htmlFor="fileExtension" className="block text-sm font-medium text-slate-700/90 mb-1.5">
            Enter file extension
          </label>
          <input
            type="text"
            id="fileExtension"
            value={targetExtension}
            onChange={handleInputChange}
            placeholder="e.g., pdf or png"
            className="w-full px-4 py-3.5 border border-slate-300/80 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500/70 focus:border-sky-500/90 transition-all duration-150 ease-in-out text-slate-800 placeholder-slate-400/80 bg-white/70 focus:bg-white/90"
            disabled={isProcessingDisabled && !totalFilesScanned}
            aria-describedby="extension-helper-text"
          />
          <p id="extension-helper-text" className="mt-1.5 text-xs text-slate-500/80">Only alphanumeric characters. No leading dot needed.</p>
        </div>
        <button
          type="submit"
          disabled={isProcessingDisabled || isProcessing || !targetExtension.trim()}
          className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/70 focus:ring-offset-2 focus:ring-offset-sky-50 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 ease-in-out flex items-center justify-center"
          aria-live="polite"
        >
          {isProcessing ? (
            <>
              <SpinnerIcon className="w-5 h-5 mr-2 text-white" />
              Filtering...
            </>
          ) : (
            <>
              <Search size={18} className="mr-2" />
              Filter & Prepare
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default FileFilter;
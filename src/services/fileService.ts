// Ensures JSZip declaration is acknowledged // This line is removed

// Helper function to promisify FileSystemFileEntry.file()
const getFileFromFileEntry = (fileEntry: FileSystemFileEntry): Promise<File> => {
  return new Promise((resolve, reject) => {
    fileEntry.file(resolve, reject);
  });
};

// Recursively reads all files from a directory entry
const getFilesInDirectory = async (directoryEntry: FileSystemDirectoryEntry): Promise<File[]> => {
  const reader = directoryEntry.createReader();
  let entries: FileSystemEntry[] = [];
  
  // readEntries might need to be called multiple times
  const readBatch = (): Promise<FileSystemEntry[]> => {
    return new Promise((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
  };

  let currentBatch = await readBatch();
  while (currentBatch.length > 0) {
    entries = entries.concat(currentBatch);
    currentBatch = await readBatch();
  }

  const files: File[] = [];
  for (const entry of entries) {
    if (entry.isFile) {
      try {
        const file = await getFileFromFileEntry(entry as FileSystemFileEntry);
        files.push(file);
      } catch (error) {
        console.error('Error reading file:', entry.name, error);
      }
    } else if (entry.isDirectory) {
      try {
        const subFiles = await getFilesInDirectory(entry as FileSystemDirectoryEntry);
        files.push(...subFiles);
      } catch (error) {
        console.error('Error reading subdirectory:', entry.name, error);
      }
    }
  }
  return files;
};

export const processDroppedItems = async (items: DataTransferItemList): Promise<File[]> => {
  const files: File[] = [];
  const promises: Promise<void>[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const entry = item.webkitGetAsEntry();

    if (entry) {
      if (entry.isFile) {
        promises.push(
          getFileFromFileEntry(entry as FileSystemFileEntry)
            // Fix: Ensure the .then callback returns void.
            .then(file => { files.push(file); })
            .catch(error => console.error('Error processing dropped file:', entry.name, error))
        );
      } else if (entry.isDirectory) {
        promises.push(
          getFilesInDirectory(entry as FileSystemDirectoryEntry)
            // Fix: Ensure the .then callback returns void.
            .then(dirFiles => { files.push(...dirFiles); })
            .catch(error => console.error('Error processing dropped directory:', entry.name, error))
        );
      }
    }
  }

  await Promise.all(promises);
  return files;
};

export const createZipFromFiles = async (filesToZip: File[], zipFileName: string): Promise<Blob> => {
  if (typeof JSZip === 'undefined') {
    throw new Error('JSZip library is not loaded. Please ensure it is included in your HTML.');
  }
  const zip = new JSZip();
  
  filesToZip.forEach(file => {
    // Add files to the root of the zip
    zip.file(file.name, file);
  });

  return zip.generateAsync({ type: 'blob' });
};

export const normalizeExtension = (ext: string): string => {
  if (!ext) return '';
  return ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
};
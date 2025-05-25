
// This declares JSZip for use with the CDN version
// Fix: Declare JSZip in the global scope so it's recognized globally.
declare global {
  var JSZip: any;
}

// If more complex types are needed, they can be defined here.
// For now, standard File objects and simple types are sufficient.

export interface AppFile extends File {
  // We can extend the File interface if we need to store additional info like relativePath
  // For this project, File is enough.
}
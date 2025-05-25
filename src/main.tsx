import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

// Simple test component to check if React is working
const TestApp = () => {
	return (
		<div className="min-h-screen bg-gradient-to-br from-sky-100 via-indigo-50 to-purple-50 flex items-center justify-center">
			<div className="text-center p-8 bg-white/80 backdrop-blur-md shadow-2xl rounded-2xl">
				<h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-700 mb-4">
					File Type Organizer
				</h1>
				<p className="text-slate-700 mb-4">
					React is working! Loading the full app...
				</p>
				<div className="w-full p-8 border-2 border-dashed border-slate-400/70 bg-white/70 backdrop-blur-sm rounded-2xl">
					<div className="flex flex-col items-center space-y-4">
						<svg
							className="w-20 h-20 text-slate-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
							/>
						</svg>
						<p className="text-lg font-semibold text-slate-700">
							Drag & Drop Folder Here
						</p>
						<p className="text-sm text-slate-500">
							We'll scan its contents, including subfolders, to find your files.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

const rootElement = document.getElementById("root");
if (!rootElement) {
	console.error("Root element not found");
	document.body.innerHTML =
		'<div style="color: red; text-align: center; padding: 2rem;">Root element not found</div>';
} else {
	console.log("Root element found, rendering React app...");
	const root = ReactDOM.createRoot(rootElement);
	root.render(<TestApp />);
}

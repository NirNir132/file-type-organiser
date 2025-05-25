import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

// Simple test component
const TestApp = () => {
	return (
		<div className="min-h-screen bg-gradient-to-br from-sky-100 via-indigo-50 to-purple-50 flex items-center justify-center">
			<div className="text-center">
				<h1 className="text-4xl font-bold text-sky-600 mb-4">
					🎉 Vite + React + Tailwind Working!
				</h1>
				<p className="text-slate-700">
					If you can see this, the build system is working correctly.
				</p>
				<button
					className="mt-4 px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
					onClick={() => alert("Button clicked! React is working!")}
				>
					Test Button
				</button>
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
	const root = ReactDOM.createRoot(rootElement);
	root.render(<TestApp />);
}

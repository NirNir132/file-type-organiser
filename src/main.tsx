import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Error Boundary Component
class ErrorBoundary extends React.Component<
	{ children: React.ReactNode },
	{ hasError: boolean; error?: Error }
> {
	constructor(props: { children: React.ReactNode }) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error) {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("React Error Boundary caught an error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="min-h-screen bg-gradient-to-br from-sky-100 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
					<div className="text-center p-8 bg-white/80 backdrop-blur-md shadow-2xl rounded-2xl max-w-md">
						<h1 className="text-2xl font-bold text-red-600 mb-4">
							Something went wrong
						</h1>
						<p className="text-slate-700 mb-4">
							The app encountered an error. This might be due to browser
							extensions or other conflicts.
						</p>
						<button
							onClick={() => window.location.reload()}
							className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
						>
							Reload Page
						</button>
						<details className="mt-4 text-left">
							<summary className="cursor-pointer text-sm text-slate-500">
								Error Details
							</summary>
							<pre className="text-xs text-red-600 mt-2 overflow-auto">
								{this.state.error?.toString()}
							</pre>
						</details>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

const rootElement = document.getElementById("root");
if (!rootElement) {
	console.error("Root element not found");
	document.body.innerHTML =
		'<div style="color: red; text-align: center; padding: 2rem;">Root element not found</div>';
} else {
	console.log("Root element found, rendering React app...");
	try {
		const root = ReactDOM.createRoot(rootElement);
		root.render(
			<ErrorBoundary>
				<App />
			</ErrorBoundary>
		);
	} catch (error) {
		console.error("Failed to render React app:", error);
		rootElement.innerHTML = `
			<div style="color: red; text-align: center; padding: 2rem; font-family: system-ui;">
				<h2>Failed to load the application</h2>
				<p>There was an error loading the React app. Please try refreshing the page.</p>
				<button onclick="window.location.reload()" style="padding: 8px 16px; background: #0ea5e9; color: white; border: none; border-radius: 4px; cursor: pointer;">
					Reload Page
				</button>
			</div>
		`;
	}
}

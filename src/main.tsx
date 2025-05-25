import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
	console.error(
		"Fatal Error: Could not find root element to mount to. The #root div is missing from index.html or not available."
	);
	document.body.innerHTML =
		'<div style="font-family: sans-serif; text-align: center; padding: 2rem; color: red;"><h1>Application Error</h1><p>Could not initialize the application. The root HTML element is missing.</p></div>';
	throw new Error("Root element not found");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);

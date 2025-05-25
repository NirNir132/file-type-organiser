import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
	console.error("Root element not found");
	document.body.innerHTML =
		'<div style="color: red; text-align: center; padding: 2rem;">Root element not found</div>';
} else {
	const root = ReactDOM.createRoot(rootElement);
	root.render(<App />);
}

import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	// Set base path: root for custom domain, subdirectory for GitHub Pages
	base: process.env.NODE_ENV === "production" ? "/" : "/file-type-organiser/",
});

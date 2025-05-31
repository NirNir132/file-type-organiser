/// <reference types="vite/client" />

// CSS modules
declare module "*.css" {
	const classes: { [key: string]: string };
	export default classes;
}

// CSS files
declare module "*.css" {
	const css: string;
	export default css;
}

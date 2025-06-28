import React from "react";
import { downloadSamplePdf } from "../utils/samplePdfGenerator";
import { downloadSampleDocx } from "../utils/sampleDocxGenerator";
import { downloadSampleImage } from "../utils/sampleImageGenerator";

const TestFileGenerator: React.FC = () => {
	return (
		<div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-xl p-6 border border-slate-200/50">
			<h3 className="text-lg font-semibold text-slate-800 mb-3">
				Test Files Generator
			</h3>
			<p className="text-sm text-slate-600 mb-4">
				Generate sample files to test the Document Intelligence feature.
			</p>
			<div className="flex flex-col sm:flex-row gap-3">
				<button
					onClick={downloadSamplePdf}
					className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
				>
					Generate Sample PDF
				</button>
				<button
					onClick={downloadSampleDocx}
					className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
				>
					Generate Sample DOCX
				</button>
				<button
					onClick={downloadSampleImage}
					className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
				>
					Generate Sample Image
				</button>
			</div>
		</div>
	);
};

export default TestFileGenerator;

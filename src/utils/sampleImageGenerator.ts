/**
 * Generates a sample image with text for testing the Document Intelligence feature
 */
export function generateSampleImage(): HTMLCanvasElement {
	// Create a canvas element
	const canvas = document.createElement("canvas");
	canvas.width = 800;
	canvas.height = 600;

	// Get the 2D context
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("Could not get canvas context");
	}

	// Fill the background
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Add a header
	ctx.fillStyle = "#000000";
	ctx.font = "bold 32px Arial";
	ctx.textAlign = "center";
	ctx.fillText("Test Document Image", canvas.width / 2, 50);

	// Add some text content
	ctx.font = "18px Arial";
	ctx.textAlign = "left";
	ctx.fillText(
		"This is a test image for the Document Intelligence feature.",
		50,
		100
	);
	ctx.fillText(
		"It contains text and a simple table that can be processed.",
		50,
		130
	);

	// Add a section heading
	ctx.font = "bold 24px Arial";
	ctx.fillText("Document Processing", 50, 180);

	// Add bullet points
	ctx.font = "18px Arial";
	ctx.fillText("• Text content extraction", 70, 220);
	ctx.fillText("• Table detection and parsing", 70, 250);
	ctx.fillText("• Layout analysis", 70, 280);
	ctx.fillText("• Metadata extraction", 70, 310);

	// Add a section heading for the table
	ctx.font = "bold 24px Arial";
	ctx.fillText("Sample Data Table", 50, 360);

	// Draw a table
	drawTable(ctx, 50, 380, 700, 160, [
		["Document Type", "Processing Time", "Accuracy"],
		["PDF", "2-3 seconds", "95%"],
		["DOCX", "1-2 seconds", "90%"],
		["Images", "3-4 seconds", "85%"],
		["HTML", "1 second", "98%"],
	]);

	// Add conclusion
	ctx.font = "bold 24px Arial";
	ctx.fillText("Conclusion", 50, 580);

	return canvas;
}

/**
 * Helper function to draw a table on the canvas
 */
function drawTable(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	data: string[][]
): void {
	const rows = data.length;
	const cols = data[0].length;

	const cellWidth = width / cols;
	const cellHeight = height / rows;

	// Draw table grid
	ctx.strokeStyle = "#000000";
	ctx.lineWidth = 1;

	// Draw horizontal lines
	for (let i = 0; i <= rows; i++) {
		ctx.beginPath();
		ctx.moveTo(x, y + i * cellHeight);
		ctx.lineTo(x + width, y + i * cellHeight);
		ctx.stroke();
	}

	// Draw vertical lines
	for (let i = 0; i <= cols; i++) {
		ctx.beginPath();
		ctx.moveTo(x + i * cellWidth, y);
		ctx.lineTo(x + i * cellWidth, y + height);
		ctx.stroke();
	}

	// Fill header row
	ctx.fillStyle = "#2980b9";
	ctx.fillRect(x, y, width, cellHeight);

	// Add text to cells
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	for (let i = 0; i < rows; i++) {
		for (let j = 0; j < cols; j++) {
			// Set text color based on whether it's a header row
			if (i === 0) {
				ctx.fillStyle = "#ffffff";
				ctx.font = "bold 16px Arial";
			} else {
				ctx.fillStyle = "#000000";
				ctx.font = "16px Arial";
			}

			// Calculate cell center position
			const cellX = x + j * cellWidth + cellWidth / 2;
			const cellY = y + i * cellHeight + cellHeight / 2;

			// Draw text
			ctx.fillText(data[i][j], cellX, cellY);
		}
	}
}

/**
 * Downloads the sample image
 */
export function downloadSampleImage(): void {
	const canvas = generateSampleImage();

	// Convert canvas to blob
	canvas.toBlob((blob) => {
		if (blob) {
			const url = URL.createObjectURL(blob);

			const link = document.createElement("a");
			link.href = url;
			link.download = "test-document.png";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		}
	}, "image/png");
}

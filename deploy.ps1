# Build and deploy script for GitHub Pages
Write-Host "Building project..." -ForegroundColor Green
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful! Copying files..." -ForegroundColor Green
    
    # Remove old built files from root (except source files)
    Remove-Item -Path "assets" -Recurse -Force -ErrorAction SilentlyContinue
    
    # Copy new built files
    Copy-Item -Path "dist\*" -Destination "." -Recurse -Force
    
    Write-Host "Files copied successfully!" -ForegroundColor Green
    Write-Host "Don't forget to commit and push the changes:" -ForegroundColor Yellow
    Write-Host "  git add ." -ForegroundColor Cyan
    Write-Host "  git commit -m 'Update build'" -ForegroundColor Cyan
    Write-Host "  git push" -ForegroundColor Cyan
} else {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
} 
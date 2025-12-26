# Astro Folder Structure Conversion Script
# Converts existing files into the specified Astro folder structure
# December 26, 2025

$ErrorActionPreference = "Stop"

# Source and target directories
$SourceDir = "_site"
$TargetDir = "@_site"
$DeployDir = "deploy"
$ImagesDir = "images"

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Astro Folder Structure Conversion" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Validate source directory
Write-Host "[1/5] Validating source directory..." -ForegroundColor Yellow
if (-not (Test-Path $SourceDir)) {
    Write-Host "ERROR: _site folder not found!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Found _site folder" -ForegroundColor Green
Write-Host ""

# Step 2: Create target directory structure
Write-Host "[2/5] Creating target directory structure..." -ForegroundColor Yellow

# Create main directories
$null = New-Item -ItemType Directory -Path $TargetDir -Force
$null = New-Item -ItemType Directory -Path $DeployDir -Force
$null = New-Item -ItemType Directory -Path "$DeployDir\css" -Force
$null = New-Item -ItemType Directory -Path "$DeployDir\images" -Force
$null = New-Item -ItemType Directory -Path "$DeployDir\js" -Force
$null = New-Item -ItemType Directory -Path $ImagesDir -Force

Write-Host "✓ Directory structure created" -ForegroundColor Green
Write-Host ""

# Step 3: Copy CSS files
Write-Host "[3/5] Copying CSS files..." -ForegroundColor Yellow
$cssSource = Join-Path $SourceDir "css"
if (Test-Path $cssSource) {
    Copy-Item "$cssSource\*" -Destination "$DeployDir\css" -Recurse -Force
    Write-Host "✓ CSS files copied to deploy\css" -ForegroundColor Green
}
Write-Host ""

# Step 4: Copy JavaScript files
Write-Host "[4/5] Copying JavaScript files..." -ForegroundColor Yellow
$jsSource = Join-Path $SourceDir "js"
if (Test-Path $jsSource) {
    Copy-Item "$jsSource\*" -Destination "$DeployDir\js" -Recurse -Force
    Write-Host "✓ JavaScript files copied to deploy\js" -ForegroundColor Green
}
Write-Host ""

# Step 5: Copy images
Write-Host "[5/5] Copying images..." -ForegroundColor Yellow
$imagesSource = Join-Path $SourceDir "images"
if (Test-Path $imagesSource) {
    # Copy to both deploy/images and images directories
    Copy-Item "$imagesSource\*" -Destination "$DeployDir\images" -Recurse -Force
    Copy-Item "$imagesSource\*" -Destination $ImagesDir -Recurse -Force
    Write-Host "✓ Images copied to deploy\images and images" -ForegroundColor Green
}
Write-Host ""

# Step 6: Copy root files to @_site
Write-Host "[6/5] Copying root files..." -ForegroundColor Yellow
$rootFiles = @("index.html", "manifest.json", "favicon.ico", "CNAME", ".nojekyll", "properties.json")
foreach ($file in $rootFiles) {
    $sourcePath = Join-Path $SourceDir $file
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath -Destination $TargetDir -Force
    }
}
Write-Host "✓ Root files copied to @_site" -ForegroundColor Green
Write-Host ""

# Step 7: Copy HTML pages to @_site
Write-Host "[7/5] Copying HTML pages..." -ForegroundColor Yellow
$htmlPages = Get-ChildItem -Path "$SourceDir\*" -Directory | Where-Object { 
    $_.Name -notin @("css", "js", "images", "design-system") 
}

foreach ($pageDir in $htmlPages) {
    $targetPath = Join-Path $TargetDir $pageDir.Name
    $null = New-Item -ItemType Directory -Path $targetPath -Force
    Copy-Item "$pageDir\*" -Destination $targetPath -Recurse -Force
}
Write-Host "✓ HTML pages copied to @_site" -ForegroundColor Green
Write-Host ""

Write-Host "====================================" -ForegroundColor Green
Write-Host "CONVERSION COMPLETE!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Folder structure created:" -ForegroundColor White
Write-Host "  @_site/" -ForegroundColor Cyan
Write-Host "  deploy/" -ForegroundColor Cyan
Write-Host "  deploy/css/" -ForegroundColor Cyan
Write-Host "  deploy/images/" -ForegroundColor Cyan
Write-Host "  deploy/js/" -ForegroundColor Cyan
Write-Host "  images/" -ForegroundColor Cyan
Write-Host ""
Write-Host "All files have been reorganized into the specified Astro folder structure." -ForegroundColor White
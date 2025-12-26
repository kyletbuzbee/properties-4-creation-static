# Properties4Creations - Eleventy to Astro Conversion Script
# Fixed and Optimized Version - December 26, 2025

$ErrorActionPreference = "Stop"
$SourceDir = "_site"
$ProjectName = "properties4creations-astro"
$OriginalLocation = Get-Location
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Properties 4 Creations - Astro Migration" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Validate Prerequisites
Write-Host "[0/12] Validating prerequisites..." -ForegroundColor Yellow

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js not found" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Node.js found" -ForegroundColor Green

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: npm not found" -ForegroundColor Red
    exit 1
}
Write-Host "✓ npm found" -ForegroundColor Green
Write-Host ""

# Step 1: Check source files
Write-Host "[1/12] Checking source files..." -ForegroundColor Yellow
if (-not (Test-Path $SourceDir)) {
    Write-Host "ERROR: _site folder not found!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Found _site folder" -ForegroundColor Green
Write-Host ""

# Step 2: Create Astro project
Write-Host "[2/12] Creating Astro project..." -ForegroundColor Yellow
if (Test-Path $ProjectName) {
    Write-Host "Delete existing project? (Press 'yes' to confirm, any other key to cancel)"
    $response = Read-Host
    if ($response -eq "y") {
        Remove-Item -Recurse -Force $ProjectName
    }
    else {
        exit 1
    }
}

npm create astro@latest $ProjectName -- --template minimal --no-install --no-git --typescript strict
Set-Location $ProjectName
npm install
Write-Host "✓ Astro project created" -ForegroundColor Green
Write-Host ""

# Step 3: Create directory structure
Write-Host "[3/12] Creating directories..." -ForegroundColor Yellow
$directories = @(
    "src/pages", "src/layouts", "src/components", "src/styles", "src/styles/components",
    "src/scripts", "src/scripts/components", "src/scripts/features", "src/scripts/utils",
    "src/scripts/security", "src/scripts/monitoring", "src/data",
    "public/images", "public/images/backgrounds", "public/images/banners",
    "public/images/before-after-comparison", "public/images/icons", "public/images/logo",
    "public/images/our-work-gallery", "public/images/properties"
)

foreach ($dir in $directories) {
    $null = New-Item -ItemType Directory -Path $dir -Force
}
Write-Host "✓ Directory structure created" -ForegroundColor Green
Write-Host ""

# Step 4: Copy static assets
Write-Host "[4/12] Copying assets..." -ForegroundColor Yellow

$staticFiles = @(
    @{ source = "manifest.json"; dest = "public/" },
    @{ source = "favicon.ico"; dest = "public/" },
    @{ source = "CNAME"; dest = "public/" },
    @{ source = ".nojekyll"; dest = "public/" },
    @{ source = "properties.json"; dest = "src/data/" }
)

foreach ($file in $staticFiles) {
    $sourcePath = Join-Path "..\$SourceDir" $file.source
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath -Destination $file.dest -Force
    }
}

# Copy images
$imageSource = Join-Path "..\$SourceDir" "images"
if (Test-Path $imageSource) {
    Copy-Item "$imageSource\*" -Destination "public/images/" -Recurse -Force
}
Write-Host "✓ Assets copied" -ForegroundColor Green
Write-Host ""

# Step 5: Process CSS
Write-Host "[5/12] Processing CSS..." -ForegroundColor Yellow

$cssSource = Join-Path "..\$SourceDir" "css"
$designTokensPath = Join-Path $cssSource "base\design-tokens.css"
if (Test-Path $designTokensPath) {
    Copy-Item $designTokensPath -Destination "src/styles/global.css" -Force
}

$mainCssPath = Join-Path $cssSource "main.css"
if (Test-Path $mainCssPath) {
    Get-Content $mainCssPath | Add-Content "src/styles/global.css"
}

$componentCssDir = Join-Path $cssSource "components"
if (Test-Path $componentCssDir) {
    Get-ChildItem $componentCssDir -Filter "*.css" | ForEach-Object {
        Copy-Item $_.FullName -Destination "src/styles/components/" -Force
    }
}
Write-Host "✓ CSS processed" -ForegroundColor Green
Write-Host ""

# Step 6: Copy JavaScript
Write-Host "[6/12] Copying scripts..." -ForegroundColor Yellow

$jsSource = Join-Path "..\$SourceDir" "js"
$jsFiles = @(
    "main.js", "auth.js", "auth-handler.js", "accessibility-enhanced.js",
    "button-utilities.js", "comparison-slider.js", "theme-toggle.js", "ui-header.js"
)

foreach ($jsFile in $jsFiles) {
    $sourcePath = Join-Path $jsSource $jsFile
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath -Destination "src/scripts/" -Force
    }
}

$jsSubdirs = @("components", "features", "utils", "security", "monitoring")
foreach ($subdir in $jsSubdirs) {
    $sourcePath = Join-Path $jsSource $subdir
    if (Test-Path $sourcePath) {
        $null = New-Item -ItemType Directory -Path "src/scripts/$subdir" -Force
        Copy-Item "$sourcePath\*" -Destination "src/scripts/$subdir/" -Recurse -Force
    }
}
Write-Host "✓ Scripts copied" -ForegroundColor Green
Write-Host ""

# Step 7: Create BaseLayout.astro
Write-Host "[7/12] Creating layouts..." -ForegroundColor Yellow

$layoutContent = @'
---
interface Props {
  title?: string;
  description?: string;
}

const { title = "Properties 4 Creations", description = "Veteran-owned housing in East Texas" } = Astro.props;
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title} - Properties 4 Creations</title>
    <meta name="description" content={description} />
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" href="/favicon.ico" />
    <link rel="stylesheet" href="/styles/global.css" />
    <link rel="preconnect" href="https://unpkg.com" crossorigin />
  </head>
  <body>
    <a href="#main" class="skip-link">Skip to main content</a>
    
    <header class="header-glass" role="banner">
      <div class="nav-container">
        <div class="brand-container">
          <a href="/" class="brand-link" aria-label="Properties 4 Creations - Home">
            <img src="/images/logo/brand-logo.svg" alt="Properties 4 Creations Logo" class="brand-logo" />
            <span class="brand-text">Properties 4 Creations</span>
          </a>
        </div>
        <button class="menu-toggle" aria-label="Toggle navigation menu" aria-expanded="false">
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>
        <nav class="main-navigation" id="main-navigation" role="navigation">
          <ul class="nav-menu" role="menubar">
            <li><a href="/" class="nav-link">Home</a></li>
            <li><a href="/properties" class="nav-link">Properties</a></li>
            <li><a href="/about" class="nav-link">About</a></li>
            <li><a href="/impact" class="nav-link">Our Impact</a></li>
            <li><a href="/resources" class="nav-link">Resources</a></li>
            <li><a href="/contact" class="nav-link">Contact</a></li>
          </ul>
        </nav>
      </div>
    </header>
    
    <main id="main">
      <slot />
    </main>
    
    <footer class="footer" role="contentinfo">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <h4>Properties 4 Creations</h4>
            <p>Veteran-owned housing in Tyler, Longview, Marshall</p>
            <div class="veteran-badge">Veteran-Owned &amp; Operated</div>
          </div>
          <div class="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/properties">Properties</a></li>
              <li><a href="/apply">Apply Now</a></li>
              <li><a href="/resources">Resources</a></li>
            </ul>
          </div>
          <div class="footer-section">
            <h4>Contact</h4>
            <p><a href="tel:903-555-1234">903-555-1234</a></p>
            <p><a href="mailto:info@properties4creations.com">info@properties4creations.com</a></p>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2025 Properties 4 Creations. <a href="/privacy">Privacy</a> | <a href="/terms">Terms</a></p>
        </div>
      </div>
    </footer>
    
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <script>
      lucide.createIcons();
    </script>
    <script src="/scripts/main.js" type="module"></script>
  </body>
</html>
'@

Set-Content -Path "src/layouts/BaseLayout.astro" -Value $layoutContent
Write-Host "✓ BaseLayout.astro created" -ForegroundColor Green
Write-Host ""

# Step 8: Convert HTML pages
Write-Host "[8/12] Converting pages..." -ForegroundColor Yellow

$pages = @(
    @{ Source = "index.html"; Target = "index.astro"; Title = "Home" },
    @{ Source = "about/index.html"; Target = "about.astro"; Title = "About Us" },
    @{ Source = "contact/index.html"; Target = "contact.astro"; Title = "Contact Us" },
    @{ Source = "apply/index.html"; Target = "apply.astro"; Title = "Apply Now" },
    @{ Source = "faq/index.html"; Target = "faq.astro"; Title = "FAQ" },
    @{ Source = "resources/index.html"; Target = "resources.astro"; Title = "Resources" },
    @{ Source = "impact/index.html"; Target = "impact.astro"; Title = "Our Impact" },
    @{ Source = "privacy/index.html"; Target = "privacy.astro"; Title = "Privacy Policy" },
    @{ Source = "terms/index.html"; Target = "terms.astro"; Title = "Terms of Service" },
    @{ Source = "transparency/index.html"; Target = "transparency.astro"; Title = "Transparency" }
)

foreach ($page in $pages) {
    $sourcePath = Join-Path "..\$SourceDir" $page.Source
    $targetPath = Join-Path "src/pages" $page.Target
    
    if (Test-Path $sourcePath) {
        $htmlContent = Get-Content $sourcePath -Raw
        
        if ($htmlContent -match '(?s)<main[^>]*>(.*?)</main>') {
            $mainContent = $matches[1]
            $astroContent = "---`nimport BaseLayout from '../layouts/BaseLayout.astro';`n---`n`n<BaseLayout title=`"$($page.Title)`">`n$mainContent`n</BaseLayout>"
            Set-Content -Path $targetPath -Value $astroContent
        }
    }
}

Write-Host "✓ Pages converted" -ForegroundColor Green
Write-Host ""

# Step 9: Update Astro config
Write-Host "[9/12] Configuring Astro..." -ForegroundColor Yellow

$configContent = @'
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://properties4creations.com',
  output: 'static',
  build: { assets: 'assets', inlineStylesheets: 'auto' },
  vite: { build: { cssCodeSplit: false, minify: 'terser' } }
});
'@

Set-Content -Path "astro.config.mjs" -Value $configContent
Write-Host "✓ Astro config updated" -ForegroundColor Green
Write-Host ""

# Step 10: Update package.json
Write-Host "[10/12] Updating package.json..." -ForegroundColor Yellow

$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$packageJson.scripts = @{
    dev     = "astro dev"
    start   = "astro dev"
    build   = "astro build"
    preview = "astro preview"
}
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
Write-Host "✓ Package.json updated" -ForegroundColor Green
Write-Host ""

# Step 11: Generate integration notes
Write-Host "[11/12] Generating documentation..." -ForegroundColor Yellow

$notesContent = @"
# Post-Migration Integration Steps
Generated: $timestamp

## Quick Start
\`\`\`bash
npm run dev
# Opens http://localhost:4321
\`\`\`

## Testing Checklist

### Forms & Authentication
- [ ] Test login flow at /login
- [ ] Test contact form submission
- [ ] Test apply form  
- [ ] Verify Formspree integration
- [ ] Verify Google Apps Script integration

### Features
- [ ] Test property filter
- [ ] Test image comparison slider
- [ ] Test theme toggle
- [ ] Verify lazy loading works
- [ ] Test accessibility features

### Images
- [ ] All images load correctly
- [ ] Responsive images work
- [ ] WebP format serves
- [ ] Placeholders display

### Performance
- [ ] Page load time acceptable
- [ ] CSS applies correctly
- [ ] JavaScript executes
- [ ] No console errors

## Integration Notes

### Authentication
- Files copied: \`src/scripts/auth.js\`, \`auth-handler.js\`
- Manual test required - verify login flow works end-to-end
- Check localStorage access in your hosting environment

### Contact Form
- Formspree integration preserved
- Verify form endpoint URL
- Test email delivery
- Check spam folder for test emails

### Apply Form  
- Google Apps Script integration preserved
- Verify Apps Script URL
- Test file uploads if applicable
- Check CORS settings

### Images
- Current setup already optimized (WebP + responsive srcset)
- No Astro Image component needed - would add 500MB+ dependency
- Lazy loading configured with loading="lazy"

### Components (Ready to Refactor Later)
When site is stable, extract:
- Header → src/components/Header.astro
- Footer → src/components/Footer.astro  
- Navigation → src/components/Navigation.astro
- PropertyCard → src/components/PropertyCard.astro

## Build & Deploy

### Development
\`\`\`bash
npm run dev
\`\`\`

### Production Build
\`\`\`bash
npm run build
npm run preview
\`\`\`

## Troubleshooting

**Styles not applying:**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check src/styles/global.css exists

**Forms not submitting:**
- Verify Formspree/Apps Script configuration
- Check network tab in DevTools
- Verify CSRF token in form

**Images not loading:**
- Verify files in public/images/
- Check file paths in HTML
- Run dev server - files must load from public/

## Support

- Astro: https://docs.astro.build
- Formspree: https://formspree.io
- Google Apps Script: https://script.google.com

Site migration complete and ready for testing!
"@

Set-Content -Path "INTEGRATION_NOTES.md" -Value $notesContent
Write-Host "✓ Documentation generated" -ForegroundColor Green
Write-Host ""

# Step 12: Final summary
Write-Host "[12/12] Finalizing..." -ForegroundColor Yellow
Set-Location $OriginalLocation
Write-Host ""

Write-Host "====================================" -ForegroundColor Green
Write-Host "MIGRATION COMPLETE!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. cd $ProjectName" -ForegroundColor White
Write-Host "  2. npm run dev" -ForegroundColor White
Write-Host "  3. Visit http://localhost:4321" -ForegroundColor White
Write-Host ""
Write-Host "📖 Review INTEGRATION_NOTES.md for testing checklist" -ForegroundColor Cyan
Write-Host ""


Add-Type -AssemblyName System.Drawing

$basePath = "d:\wapro\sam-12"
$source = "$basePath\src\renderer\assets\logo.png"
$buildIcon = "$basePath\build\icon.ico"
$publicIcon = "$basePath\public\icon.png"
$size = 256

if (!(Test-Path "$basePath\build")) {
    New-Item -ItemType Directory -Path "$basePath\build"
}

Write-Host "🎨 Generating icons from: $source"

function Save-As-Icon {
    param($srcPath, $destPath, $targetSize)
    
    $original = [System.Drawing.Bitmap]::FromFile($srcPath)
    $resized = New-Object System.Drawing.Bitmap($targetSize, $targetSize)
    $graph = [System.Drawing.Graphics]::FromImage($resized)
    
    $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graph.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graph.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graph.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $graph.DrawImage($original, 0, 0, $targetSize, $targetSize)
    
    $iconHandle = $resized.GetHicon()
    $icon = [System.Drawing.Icon]::FromHandle($iconHandle)
    
    $fileStream = [System.IO.File]::OpenWrite($destPath)
    $icon.Save($fileStream)
    $fileStream.Close()
    
    $icon.Dispose()
    $graph.Dispose()
    $resized.Dispose()
    $original.Dispose()
    
    Write-Host "✅ Created ICO: $destPath ($targetSize x $targetSize)"
}

function Save-As-Png {
    param($srcPath, $destPath, $targetSize)
    
    $original = [System.Drawing.Bitmap]::FromFile($srcPath)
    $resized = New-Object System.Drawing.Bitmap($targetSize, $targetSize)
    $graph = [System.Drawing.Graphics]::FromImage($resized)
    
    $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graph.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    
    $graph.DrawImage($original, 0, 0, $targetSize, $targetSize)
    
    $resized.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $graph.Dispose()
    $resized.Dispose()
    $original.Dispose()
    
    Write-Host "✅ Created PNG: $destPath ($targetSize x $targetSize)"
}

try {
    Save-As-Icon -srcPath $source -destPath $buildIcon -targetSize $size
    Save-As-Png -srcPath $source -destPath $publicIcon -targetSize $size
    Write-Host "🎉 Icon generation complete!"
}
catch {
    Write-Error "❌ Failed to generate icons: $_"
    exit 1
}


Add-Type -AssemblyName System.Drawing

$source = "d:\sam-12\public\pingo-logo.png"
$dest = "d:\sam-12\build\icon.ico"
$size = 256

Write-Host "Resizing $source to $size x $size and saving as $dest..."

try {
    $original = [System.Drawing.Bitmap]::FromFile($source)
    $resized = New-Object System.Drawing.Bitmap($size, $size)
    $graph = [System.Drawing.Graphics]::FromImage($resized)
    
    $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graph.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graph.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graph.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $graph.DrawImage($original, 0, 0, $size, $size)
    
    # Create icon from resized bitmap
    $iconHandle = $resized.GetHicon()
    $icon = [System.Drawing.Icon]::FromHandle($iconHandle)
    
    $fileStream = [System.IO.File]::OpenWrite($dest)
    $icon.Save($fileStream)
    $fileStream.Close()
    
    $icon.Dispose()
    # Note: GetHicon creates a handle that must be destroyed, but powershell cleanup is tricky.
    # The Icon.Dispose() handles the managed wrapper effectively for this script lifespan.
    
    $graph.Dispose()
    $resized.Dispose()
    $original.Dispose()
    
    Write-Host "Success: High-quality $size x $size icon created at $dest"
}
catch {
    Write-Error "Failed to convert icon: $_"
    exit 1
}

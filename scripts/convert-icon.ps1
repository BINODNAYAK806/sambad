
Add-Type -AssemblyName System.Drawing
$source = "d:\sam-12\public\pingo-logo.png"
$dest = "d:\sam-12\build\icon.ico"

Write-Host "Converting $source to $dest..."

try {
    $bitmap = [System.Drawing.Bitmap]::FromFile($source)
    # create an icon from the bitmap handle
    $icon = [System.Drawing.Icon]::FromHandle($bitmap.GetHicon())
    
    $fileStream = [System.IO.File]::OpenWrite($dest)
    $icon.Save($fileStream)
    $fileStream.Close()
    
    $icon.Dispose()
    $bitmap.Dispose()
    
    Write-Host "Success: Icon created at $dest"
}
catch {
    Write-Error "Failed to convert icon: $_"
    exit 1
}

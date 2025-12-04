$versionFile = "VERSION"

if (Test-Path $versionFile) {
    $currentVersion = Get-Content $versionFile
    Write-Host "Versión actual: v$currentVersion"
    
    $parts = $currentVersion.Split('.')
    $major = $parts[0]
    $minor = [int]$parts[1]
    
    $newMinor = $minor + 1
    $newVersion = "$major.$newMinor"
    
    Set-Content $versionFile $newVersion
    Write-Host "Nueva versión: v$newVersion"
    
    git add .
    git commit -m "v$newVersion"
    git push
}
else {
    Write-Host "Archivo VERSION no encontrado."
}

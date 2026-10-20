$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ReticulumDir = Resolve-Path (Join-Path $ScriptDir "..")
$VenvDir = Join-Path $ReticulumDir ".venv"
$Python = Get-Command py -ErrorAction SilentlyContinue

if ($Python) {
    & py -3 --version
    if ($LASTEXITCODE -ne 0) {
        throw "Python 3 was not found. Install Python 3 from https://www.python.org/downloads/windows/ and rerun this script."
    }
    & py -3 -m venv $VenvDir
} else {
    $Python = Get-Command python -ErrorAction SilentlyContinue
    if (-not $Python) {
        throw "Python 3 was not found. Install Python 3 from https://www.python.org/downloads/windows/ and rerun this script."
    }
    & python -m venv $VenvDir
}
if ($LASTEXITCODE -ne 0) { throw "Could not create the project-local Python virtual environment." }

$VenvPython = Join-Path $VenvDir "Scripts\python.exe"
& $VenvPython -m pip install --upgrade pip
if ($LASTEXITCODE -ne 0) { throw "Could not update pip inside the project-local virtual environment." }

& $VenvPython -m pip install rns
if ($LASTEXITCODE -ne 0) { throw "Reticulum package installation failed. Review the pip error above." }

& $VenvPython -c "import RNS; print('Reticulum Python import: OK'); print('Module:', RNS.__file__)"
if ($LASTEXITCODE -ne 0) { throw "The Reticulum package installed but the import verification failed." }

Write-Host ""
Write-Host "Installation and import check completed on this computer."
Write-Host "Environment: $VenvDir"
Write-Host "This does not verify peer discovery or offline message delivery."
Write-Host "No firewall, router, system service, or network interface settings were changed."

param([Parameter(Mandatory=$true)][string]$Tarball)
$ErrorActionPreference = "Stop"
if (-not (Test-Path -LiteralPath $Tarball -PathType Leaf)) { throw "Package archive not found: $Tarball" }
npm install --global (Resolve-Path -LiteralPath $Tarball)
ai-workspace version

param([string]$Package = "ai-engineering-workspace", [switch]$Silent)
$ErrorActionPreference = "Stop"
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw "Node.js 20.19+ and npm are required." }
npm install --global $Package
if (-not $Silent) { ai-workspace version }

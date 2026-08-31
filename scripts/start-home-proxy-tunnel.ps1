[CmdletBinding()]
param(
  [Parameter(Mandatory = $false)]
  [string]$VpsHost = "169.58.252.130",
  [Parameter(Mandatory = $false)]
  [string]$SshUser = "tubetunnel",
  [Parameter(Mandatory = $false)]
  [string]$KeyPath = "$env:USERPROFILE\.ssh\contabo_key",
  [Parameter(Mandatory = $false)]
  [int]$LocalProxyPort = 8080,
  [Parameter(Mandatory = $false)]
  [int]$RemoteProxyPort = 8080
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $KeyPath)) {
  throw "SSH key not found: $KeyPath"
}

$localCheck = Test-NetConnection -ComputerName 127.0.0.1 -Port $LocalProxyPort -WarningAction SilentlyContinue
if (-not $localCheck.TcpTestSucceeded) {
  throw "No local HTTP/SOCKS proxy is listening on 127.0.0.1:$LocalProxyPort. Start a trusted local proxy first."
}

$forward = "127.0.0.1:{0}:127.0.0.1:{1}" -f $RemoteProxyPort, $LocalProxyPort
Write-Host "Forwarding Contabo 127.0.0.1:$RemoteProxyPort to this PC 127.0.0.1:$LocalProxyPort. Keep this window open."

& ssh.exe `
  -N `
  -T `
  -i $KeyPath `
  -o BatchMode=yes `
  -o ExitOnForwardFailure=yes `
  -o ServerAliveInterval=30 `
  -o ServerAliveCountMax=3 `
  -R $forward `
  "{0}@{1}" -f $SshUser, $VpsHost

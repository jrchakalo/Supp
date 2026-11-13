param(
  [string]$EnvFile = ".env.vercel",
  [string]$Environment = "production"
)

# Requires: npx vercel login  +  npx vercel link
# Reads the local .env.vercel (gitignored) and pushes each key to Vercel.
# Values are piped via stdin, so they do not appear in the process arguments.

if (-not (Test-Path $EnvFile)) {
  throw "Arquivo $EnvFile não encontrado. Gere com: node scripts/... ou copie do .env.local."
}

$lines = Get-Content $EnvFile | Where-Object { $_ -match '^[A-Z0-9_]+=' }
foreach ($line in $lines) {
  $null = $line -match '^([A-Z0-9_]+)=(.*)$'
  $key = $matches[1]
  $value = $matches[2]
  $type = if ($key -like 'NEXT_PUBLIC_*') { 'config' } else { 'secret' }
  Write-Host "Adicionando $key em $Environment ($type)..."
  $value | npx --yes vercel env add $key $Environment --type $type --force --yes
  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao adicionar $key"
  }
}

Write-Host "Pronto. Rode um novo deploy para aplicar as variáveis:"
Write-Host "  npx vercel --prod"

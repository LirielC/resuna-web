# Script de inicialização do backend
# Carrega variáveis do .env e inicia o servidor

Write-Host "🚀 Iniciando backend ResunaWeb..." -ForegroundColor Green

# Ler .env e carregar variáveis
if (Test-Path ".env") {
    Write-Host "📁 Carregando variáveis do .env..." -ForegroundColor Cyan

    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()

            # Remove aspas se houver
            $value = $value -replace '^["'']|["'']$', ''

            # Definir variável de ambiente
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
            Write-Host "  ✅ $key" -ForegroundColor Gray
        }
    }

    Write-Host ""
} else {
    Write-Host "❌ Arquivo .env não encontrado!" -ForegroundColor Red
    exit 1
}

# Iniciar Spring Boot
Write-Host "🔥 Iniciando Spring Boot..." -ForegroundColor Yellow
mvn spring-boot:run

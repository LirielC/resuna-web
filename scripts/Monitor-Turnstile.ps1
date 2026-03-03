# ============================================
# Script de Monitoramento do Turnstile (PowerShell)
# ============================================

param(
    [string]$LogPath = "..\resuna-web\backend\logs\application.log",
    [int]$MaxFailureRate = 15,
    [string]$AlertEmail = "",
    [string]$SlackWebhook = ""
)

Write-Host "🔍 Verificando métricas do Turnstile..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar se arquivo de log existe
if (-not (Test-Path $LogPath)) {
    Write-Host "❌ Arquivo de log não encontrado: $LogPath" -ForegroundColor Red
    exit 1
}

# Ler logs
$logContent = Get-Content $LogPath

Write-Host "`n📊 Métricas das últimas 24 horas:`n"

# Total de verificações
$total = ($logContent | Select-String "TURNSTILE").Count
Write-Host "   Total de verificações: $total"

# Sucessos
$success = ($logContent | Select-String "✅ \[TURNSTILE\] Verified successfully").Count
Write-Host "   ✅ Sucessos: $success" -ForegroundColor Green

# Falhas
$failures = ($logContent | Select-String "⚠️ \[TURNSTILE\] Verification failed").Count
Write-Host "   ⚠️  Falhas: $failures" -ForegroundColor Yellow

# Fraudes detectadas
$fraud = ($logContent | Select-String "🚨 \[FRAUD\] Potential bot").Count
Write-Host "   🚨 Bots detectados: $fraud" -ForegroundColor Red

Write-Host ""

# Calcular taxa de falha
if ($total -gt 0) {
    $failureRate = [math]::Round(($failures / $total) * 100, 2)
    Write-Host "   Taxa de falha: $failureRate%"

    # Verificar threshold
    if ($failureRate -gt $MaxFailureRate) {
        Write-Host "`n🚨 ALERTA: Taxa de falha muito alta!" -ForegroundColor Red
        Write-Host "   Threshold: $MaxFailureRate%"
        Write-Host "   Atual: $failureRate%`n"

        # Enviar alerta via Slack (se configurado)
        if ($SlackWebhook) {
            $payload = @{
                text = "🚨 *ALERTA Turnstile*`nTaxa de falha: $failureRate%`nTotal: $total | Falhas: $failures | Bots: $fraud"
            } | ConvertTo-Json

            try {
                Invoke-RestMethod -Uri $SlackWebhook -Method Post -Body $payload -ContentType 'application/json'
                Write-Host "   📤 Alerta enviado para Slack" -ForegroundColor Green
            } catch {
                Write-Host "   ❌ Erro ao enviar alerta: $_" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "   ✅ Taxa de falha normal" -ForegroundColor Green
    }
} else {
    Write-Host "   ⚠️  Nenhuma verificação registrada" -ForegroundColor Yellow
}

Write-Host ""

# Top IPs com mais falhas
Write-Host "🔝 Top 5 IPs com mais falhas:"
$failedIPs = $logContent |
    Select-String "⚠️ \[TURNSTILE\] Verification failed from IP: ([\d\.]+)" |
    ForEach-Object { $_.Matches.Groups[1].Value } |
    Group-Object |
    Sort-Object Count -Descending |
    Select-Object -First 5

foreach ($ip in $failedIPs) {
    Write-Host "   $($ip.Name): $($ip.Count) falhas"
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "✅ Monitoramento concluído`n" -ForegroundColor Green

Write-Host "💡 Dica: Adicione ao Agendador de Tarefas do Windows para executar automaticamente"
Write-Host "   Tarefa: PowerShell.exe -ExecutionPolicy Bypass -File `"$PSCommandPath`"`n"

# Exportar métricas para JSON (opcional)
$metrics = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    total = $total
    success = $success
    failures = $failures
    fraud = $fraud
    failureRate = if ($total -gt 0) { $failureRate } else { 0 }
    topFailedIPs = $failedIPs | ForEach-Object { @{ ip = $_.Name; count = $_.Count } }
}

$metricsPath = ".\turnstile-metrics.json"
$metrics | ConvertTo-Json -Depth 3 | Out-File $metricsPath
Write-Host "📁 Métricas salvas em: $metricsPath" -ForegroundColor Cyan

#!/bin/bash

# ============================================
# Script de Monitoramento do Turnstile
# ============================================
# Este script verifica métricas do Turnstile
# e envia alertas se algo estiver errado

# Configuração
BACKEND_URL="http://localhost:8080"
ALERT_EMAIL="seu-email@exemplo.com"
ALERT_WEBHOOK="" # Opcional: Slack/Discord webhook

# Thresholds
MAX_FAILURE_RATE=15  # Alerta se > 15% de falhas
MIN_SUCCESS_RATE=85  # Alerta se < 85% de sucesso

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Verificando métricas do Turnstile..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Buscar métricas do backend
# TODO: Criar endpoint /api/admin/turnstile/metrics no backend
# Por enquanto, vamos analisar os logs

LOG_FILE="../backend/logs/application.log"

if [ ! -f "$LOG_FILE" ]; then
    echo "${RED}❌ Arquivo de log não encontrado: $LOG_FILE${NC}"
    exit 1
fi

# Contar eventos nas últimas 24h
LAST_24H=$(date -d "24 hours ago" +"%Y-%m-%d")

echo "📊 Métricas das últimas 24 horas:"
echo ""

# Total de verificações
TOTAL=$(grep "TURNSTILE" "$LOG_FILE" | grep -c "")
echo "   Total de verificações: $TOTAL"

# Sucessos
SUCCESS=$(grep "✅ \[TURNSTILE\] Verified successfully" "$LOG_FILE" | grep -c "")
echo "${GREEN}   ✅ Sucessos: $SUCCESS${NC}"

# Falhas
FAILURES=$(grep "⚠️ \[TURNSTILE\] Verification failed" "$LOG_FILE" | grep -c "")
echo "${YELLOW}   ⚠️  Falhas: $FAILURES${NC}"

# Fraudes detectadas
FRAUD=$(grep "🚨 \[FRAUD\] Potential bot" "$LOG_FILE" | grep -c "")
echo "${RED}   🚨 Bots detectados: $FRAUD${NC}"

echo ""

# Calcular taxa de falha
if [ $TOTAL -gt 0 ]; then
    FAILURE_RATE=$((FAILURES * 100 / TOTAL))
    echo "   Taxa de falha: ${FAILURE_RATE}%"

    # Verificar se está acima do threshold
    if [ $FAILURE_RATE -gt $MAX_FAILURE_RATE ]; then
        echo ""
        echo "${RED}🚨 ALERTA: Taxa de falha muito alta!${NC}"
        echo "   Threshold: ${MAX_FAILURE_RATE}%"
        echo "   Atual: ${FAILURE_RATE}%"
        echo ""

        # Enviar alerta (exemplo)
        # mail -s "ALERTA Turnstile: Taxa de falha alta" $ALERT_EMAIL <<< "Taxa de falha: ${FAILURE_RATE}%"
    else
        echo "${GREEN}   ✅ Taxa de falha normal${NC}"
    fi
else
    echo "   ${YELLOW}⚠️  Nenhuma verificação registrada${NC}"
fi

echo ""

# Top IPs com mais falhas
echo "🔝 Top 5 IPs com mais falhas:"
grep "⚠️ \[TURNSTILE\] Verification failed from IP:" "$LOG_FILE" | \
    awk '{print $(NF-2)}' | \
    sort | uniq -c | sort -rn | head -5 | \
    while read count ip; do
        echo "   $ip: $count falhas"
    done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Monitoramento concluído"
echo ""
echo "💡 Dica: Adicione este script ao crontab para executar a cada hora:"
echo "   0 * * * * /caminho/para/monitor-turnstile.sh"

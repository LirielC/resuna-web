#!/bin/bash
set -e

PROJECT="gen-lang-client-0111451897"
SECRET_NAME="GEMINI_API_KEY"
SA="34963359753-compute@developer.gserviceaccount.com"

read -rsp "Cole sua Gemini API Key (não aparecerá na tela): " API_KEY
echo

if [ -z "$API_KEY" ]; then
  echo "Erro: nenhuma key fornecida."
  exit 1
fi

echo "$API_KEY" | tr -d '\n' | gcloud secrets create "$SECRET_NAME" \
  --project="$PROJECT" \
  --data-file=-

echo "Secret criado. Adicionando permissão de acesso ao Cloud Run..."

gcloud secrets add-iam-policy-binding "$SECRET_NAME" \
  --project="$PROJECT" \
  --member="serviceAccount:$SA" \
  --role="roles/secretmanager.secretAccessor"

echo "Pronto! Agora rode: ./deploy.sh"

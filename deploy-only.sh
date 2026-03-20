#!/bin/bash
set -e

PROJECT="gen-lang-client-0111451897"
REGION="us-central1"
BACKEND_IMAGE="gcr.io/$PROJECT/resuna-backend"
FRONTEND_IMAGE="gcr.io/$PROJECT/resuna-frontend"

# Mesmos limites que deploy.sh (tier gratuito Cloud Run).

echo "==> Deploy do BACKEND..."
gcloud run deploy resuna-backend \
  --image "$BACKEND_IMAGE" \
  --region "$REGION" \
  --platform managed \
  --project "$PROJECT" \
  --cpu=0.5 \
  --memory=512Mi \
  --concurrency=1 \
  --min-instances=0 \
  --max-instances=5 \
  --no-cpu-boost \
  --set-secrets="FIREBASE_CREDENTIALS_JSON=FIREBASE_CREDENTIALS_JSON:latest,OPENROUTER_API_KEY=OPENROUTER_API_KEY:latest,TURNSTILE_SECRET_KEY=TURNSTILE_SECRET_KEY:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --set-env-vars="^|^CORS_ALLOWED_ORIGINS=https://resuna-frontend-34963359753.us-central1.run.app,https://resuna.app,https://www.resuna.app|INITIAL_ADMIN_EMAIL=littledevarch@gmail.com"

echo "==> Deploy do FRONTEND..."
gcloud run deploy resuna-frontend \
  --image "$FRONTEND_IMAGE" \
  --region "$REGION" \
  --platform managed \
  --project "$PROJECT" \
  --cpu=0.25 \
  --memory=512Mi \
  --concurrency=1 \
  --min-instances=0 \
  --max-instances=5 \
  --no-cpu-boost \
  --set-env-vars="API_URL=https://resuna-backend-34963359753.us-central1.run.app"

echo "==> Deploy concluido!"
echo "Backend:  https://resuna-backend-34963359753.us-central1.run.app"
echo "Frontend: https://resuna-frontend-34963359753.us-central1.run.app"

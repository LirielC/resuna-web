#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT="gen-lang-client-0111451897"
REGION="us-central1"
BACKEND_IMAGE="gcr.io/$PROJECT/resuna-backend"
FRONTEND_IMAGE="gcr.io/$PROJECT/resuna-frontend"

DEPLOY_ENV="${DEPLOY_ENV:-$SCRIPT_DIR/deploy.env}"
load_frontend_build_env() {
  if [[ -f "$DEPLOY_ENV" ]]; then
    set -a
    # shellcheck source=/dev/null
    source "$DEPLOY_ENV"
    set +a
  fi
  if [[ -z "${NEXT_PUBLIC_FIREBASE_API_KEY:-}" || -z "${NEXT_PUBLIC_FIREBASE_PROJECT_ID:-}" ]]; then
    echo "==> Erro: defina Firebase no ficheiro deploy.env (cópia de deploy.env.example)."
    echo "    Caminho: $DEPLOY_ENV"
    echo "    O Next.js precisa de NEXT_PUBLIC_* no *build*; variáveis só no Cloud Run não chegam."
    exit 1
  fi
}

# Cloud Run free tier: min-instances=0 (escala a zero), CPU/mem baixos, sem CPU boost no startup.
# Com CPU fracionaria (< 1 vCPU) o GCP exige --concurrency=1: cloud.google.com/run/docs/configuring/cpu
# Backend Java: se OOM no cold start, tente --memory=1Gi (gasta mais GiB-segundo do quota mensal).

echo "==> Build e deploy do BACKEND..."
cd "$SCRIPT_DIR/resuna-web/backend"
gcloud builds submit --tag "$BACKEND_IMAGE" --project="$PROJECT" .

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
  --set-env-vars="^|^SPRING_PROFILES_ACTIVE=prod|CORS_ALLOWED_ORIGINS=https://resuna-frontend-34963359753.us-central1.run.app,https://resuna.app,https://www.resuna.app|INITIAL_ADMIN_EMAIL=littledevarch@gmail.com"

echo "==> Build e deploy do FRONTEND (NEXT_PUBLIC_* a partir de deploy.env)..."
load_frontend_build_env
# Substituições Cloud Build: evitar vírgulas nos valores (site keys Firebase não têm).
gcloud builds submit "$SCRIPT_DIR/resuna-web" \
  --project="$PROJECT" \
  --config="$SCRIPT_DIR/resuna-web/cloudbuild-frontend.yaml" \
  --substitutions="_NP_FB_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY},_NP_FB_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN},_NP_FB_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID},_NP_FB_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET},_NP_FB_MSG_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID},_NP_FB_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID},_NP_TURNSTILE_SITE_KEY=${NEXT_PUBLIC_TURNSTILE_SITE_KEY:-}"

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

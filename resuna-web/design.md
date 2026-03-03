# Resuna Web - Technical Design Document

## Overview

Resuna Web is a SaaS platform that enables users to create ATS-optimized resumes, analyze job compatibility using Python + NLP, and refine with generative AI (Gemini API). The system monetizes via monthly subscription ($9.99/month) through Paddle, with all infrastructure on Firebase and Google Cloud.

**Target Market:** United States and United Kingdom  
**App Language:** English (entire UI/UX in English)

**Core Principle:** Never edit PDF directly. Everything is Resume JSON → PDF is always rendered from JSON.

**AI Translation Feature:** Users can translate their resumes from English to Portuguese (PT-BR), French (FR), Spanish (ES), and Japanese (JA) using Gemini AI.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React 18   │  │   Tailwind   │  │   Zustand    │      │
│  │  Components  │  │     CSS      │  │    State     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│              Deployed on Vercel (Free Tier)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Backend API (Spring Boot)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Spring Web   │  │   Firebase   │  │    Paddle    │      │
│  │  REST API    │  │  Admin SDK   │  │   Webhooks   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│              Deployed on Cloud Run                           │
└─────────────────────────────────────────────────────────────┘
              │                           │
┌─────────────────────────┐  ┌────────────────────────┐
│  ATS Engine (FastAPI)   │  │  IA Refiner (Gemini)   │
│    - Cloud Run          │  │    - Gemini API        │
│    - Python + spaCy     │  │    - Prompt Engineering│
└─────────────────────────┘  └────────────────────────┘
              │                           │
┌─────────────────────────────────────────────────────────────┐
│                 Firebase / Google Cloud Services             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Firestore   │  │     GCS      │  │    Secret    │      │
│  │  (NoSQL DB)  │  │  (Storage)   │  │   Manager    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │Firebase Auth │  │   Paddle     │                        │
│  │              │  │  (Payments)  │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

**Frontend (Next.js 14):**
- React 18 com Server Components
- Next.js 14 App Router
- TypeScript
- Tailwind CSS para estilização
- Zustand para state management
- React Hook Form + Zod para forms
- TanStack Query para data fetching
- Deployed on Vercel (free tier)

**Backend API (Spring Boot 3):**
- Java 21 (LTS)
- Spring Boot 3.2+
- Spring Web (REST API)
- Spring Security (JWT validation)
- Firebase Admin SDK for Java
- Paddle Java SDK (or REST client)
- Apache PDFBox or iText for PDF generation
- Apache POI for DOCX generation
- Deployed on Cloud Run

**ATS Engine (Python):**
- Python 3.11+
- FastAPI framework
- spaCy para NLP
- NLTK para stopwords e stemming
- Pydantic para validação
- Deployed on Cloud Run (internal only)

**AI Refiner & Translator:**
- Google AI SDK for Java (Gemini API)
- Gemini Pro / Gemini Flash
- Prompt templates for: Resume refinement, Cover Letter, Translation

**Infrastructure (Firebase + Google Cloud):**
- Firebase Authentication (Google Sign-In, Email/Password, Magic Link)
- Cloud Firestore (NoSQL database)
- Cloud Storage (GCS buckets)
- Cloud Run (serverless containers)
- Secret Manager
- Vercel (frontend hosting)
- Paddle (payments - Merchant of Record)

## Components and Interfaces

### Frontend Components

#### 1. ResumeBuilder (React)
Editor principal de currículo com preview em tempo real.

```typescript
// components/ResumeBuilder.tsx
interface ResumeBuilderProps {
  resumeId?: string;
  onSave: (resume: Resume) => void;
}

export function ResumeBuilder({ resumeId, onSave }: ResumeBuilderProps) {
  // Seções: basics, experience, education, skills, etc.
  // Preview PDF ao lado direito
  // Auto-save a cada 30 segundos
}
```

#### 2. JobAnalyzer
Upload e análise de vaga.

```typescript
// components/JobAnalyzer.tsx
interface JobAnalyzerProps {
  resumeId: string;
  onAnalysisComplete: (result: AnalysisResult) => void;
}

// Suporta: paste de texto, upload de PDF/DOCX, URL (scraping)
```

#### 3. Dashboard
Métricas e overview do usuário.

```typescript
// components/Dashboard.tsx
// - Total de currículos
// - Total de análises
// - Gráfico de evolução de score
// - Skills mais faltantes
```

#### 4. Paywall
Modal de conversão para premium.

```typescript
// components/Paywall.tsx
// - Benefícios do premium
// - Plano mensal vs anual
// - Checkout via Paddle Overlay
```

### Backend API Endpoints

#### Authentication
```yaml
POST /api/auth/session
  # Verifica Firebase token e cria sessão

GET /api/auth/me
  # Retorna dados do usuário logado
```

#### Resume
```yaml
GET /api/resumes
  # Lista currículos do usuário

POST /api/resumes
  # Cria novo currículo

GET /api/resumes/:id
  # Retorna currículo específico

PUT /api/resumes/:id
  # Atualiza currículo

DELETE /api/resumes/:id
  # Deleta currículo

POST /api/resumes/:id/pdf
  # Gera PDF do currículo

POST /api/resumes/:id/docx
  # Gera DOCX do currículo
```

#### Job & Analysis
```yaml
POST /api/jobs
  # Cria vaga (texto ou upload)

POST /api/jobs/:jobId/analyze
  # Analisa compatibilidade com currículo

GET /api/analyses
  # Histórico de análises
```

#### AI Features (Premium)
```yaml
POST /api/refine
  # Refines resume with AI

POST /api/cover-letter
  # Generates cover letter

POST /api/translate
  # Translates resume to target language
  # Body: { resumeId, targetLanguage: 'pt-BR' | 'fr' | 'es' | 'ja' }
  # Response: { translatedResumeId, message }
```

#### Billing (Paddle)
```yaml
POST /api/billing/checkout
  # Abre Paddle Checkout Overlay

GET /api/billing/subscription
  # Status da assinatura atual

POST /api/billing/webhook
  # Webhook do Paddle para eventos

POST /api/billing/cancel
  # Cancela assinatura via Paddle API
```

#### Sharing
```yaml
POST /api/resumes/:id/share
  # Gera link público

GET /api/s/:shareId
  # Página pública do currículo (SSR)

DELETE /api/resumes/:id/share/:shareId
  # Revoga link
```

## Data Models (Firestore)

### Collections Structure
```
/users/{userId}
  - email, name, createdAt, updatedAt
  
/users/{userId}/resumes/{resumeId}
  - name, language, basics, experience, education, skills, ...
  - targetJobId?, parentResumeId?
  
/users/{userId}/jobs/{jobId}
  - title, company, description, requirements, createdAt
  
/users/{userId}/analyses/{analysisId}
  - resumeId, jobId, scoreTotal, matched, missing, recommendations
  
/users/{userId}/coverLetters/{id}
  - resumeId, jobId, content, language, createdAt

/subscriptions/{paddleSubscriptionId}
  - userId, status, planId, currentPeriodEnd, cancelAtPeriodEnd

/shareLinks/{shareId}
  - resumeId, userId, expiresAt, viewCount

/refineCredits/{userId}
  - creditsRemaining, creditsUsed, lastPurchaseAt
```

### Resume JSON Schema
```typescript
interface Resume {
  id: string;
  userId: string;
  name: string;
  language: 'pt-BR' | 'en-US';
  
  basics: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    portfolio?: string;
    summary: string;
  };
  
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    bullets: string[];
  }>;
  
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate?: string;
  }>;
  
  skills: Array<{
    category: string;
    items: string[];
  }>;
  
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  
  languages?: Array<{
    language: string;
    level: string;
  }>;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Billing Architecture (Paddle)

### Vantagens do Paddle
- **Merchant of Record**: Paddle é o vendedor (não precisa de CNPJ)
- **Impostos automáticos**: IVA, Sales Tax gerenciados pelo Paddle
- **Checkout localizado**: Suporte a PIX, cartões brasileiros
- **Menos compliance**: Paddle cuida de chargebacks e disputas

### Products Configuration
```yaml
Products:
  resuna_premium_monthly:
    name: "Resuna Premium Mensal"
    price: R$ 29,90/mês
    billing_cycle: monthly
    
  resuna_premium_yearly:
    name: "Resuna Premium Anual"
    price: R$ 299,90/ano (R$ 24,99/mês)
    billing_cycle: yearly
    
  refine_pack_5:
    name: "5 Refinos"
    price: R$ 14,90 (one-time)
    
  refine_pack_15:
    name: "15 Refinos"
    price: R$ 34,90 (one-time)
```

### Subscription States
```
┌─────────────┐    payment     ┌─────────────┐
│   TRIALING   │ ─────────────► │   ACTIVE    │
│   (3 days)   │    success     │             │
└─────────────┘                └─────────────┘
      │                              │
      │ trial_ended                  │ payment_failed
      │ no_payment                   ▼
      │                        ┌─────────────┐
      │                        │  PAST_DUE   │
      └──────────────┐         └─────────────┘
                     │               │
                     ▼               │ 3x failed
               ┌─────────────┐       ▼
               │  CANCELED   │◄─────────────────
               └─────────────┘
```

### Paddle Webhooks
```typescript
// api/billing/webhook.ts
switch (event.event_type) {
  case 'subscription.created':
    // Criar subscription no Firestore
    break;
  case 'subscription.activated':
    // Atualizar status para ACTIVE
    break;
  case 'subscription.payment_failed':
    // Atualizar status para PAST_DUE
    break;
  case 'subscription.canceled':
    // Revogar acesso
    break;
  case 'transaction.completed':
    // Para compras únicas (pacotes de refino)
    break;
}
```

### Frontend Integration
```typescript
// Abrir Paddle Checkout
import { initializePaddle, Paddle } from '@paddle/paddle-js';

const paddle = await initializePaddle({ 
  environment: 'production',
  token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN 
});

paddle.Checkout.open({
  items: [{ priceId: 'pri_xxxxx', quantity: 1 }],
  customer: { email: user.email },
  customData: { userId: user.uid }
});
```

## Security Architecture

### Authentication Flow
```
1. User clicks "Login with Google"
2. Firebase Auth handles OAuth
3. Frontend receives Firebase ID Token
4. Frontend sends token to Backend
5. Backend verifies token with Firebase Admin SDK
6. Backend creates session cookie (httpOnly, secure)
7. Subsequent requests use session cookie
```

### Security Measures
- **HTTPS** obrigatório everywhere
- **CORS** restrito a domínios permitidos
- **CSRF** protection via SameSite cookies
- **Rate Limiting** por IP e por usuário
- **Input Validation** com Zod schemas
- **SQL Injection** N/A (Firestore é NoSQL)
- **XSS** React escapa automaticamente + CSP headers

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId;
    }
    
    // Share links are public for reading
    match /shareLinks/{shareId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Subscriptions managed by backend only
    match /subscriptions/{customerId} {
      allow read: if request.auth != null;
      allow write: if false; // Only backend via Admin SDK
    }
  }
}
```

## Free Tier Limits

| Service | Free Tier | Enough for |
|---------|-----------|------------|
| **Vercel** | 100GB bandwidth, unlimited deploys | ~10k users |
| **Firestore** | 1GB storage, 50k reads/day | ~500 active users |
| **Cloud Run** | 2M requests/month | ~500 active users |
| **Cloud Storage** | 5GB | ~1000 PDFs stored |
| **Firebase Auth** | Unlimited | Unlimited |
| **Gemini API** | 60 req/min | Premium users only |
| **Paddle** | 5-10% + impostos incluídos | - |

## SEO & Performance

### Next.js Optimizations
```typescript
// Static generation for public pages
export async function generateStaticParams() {
  return [{ locale: 'pt-BR' }, { locale: 'en' }];
}

// Dynamic meta tags
export async function generateMetadata({ params }) {
  return {
    title: 'Resuna - Currículos ATS Otimizados',
    description: 'Crie currículos que passam pelos filtros ATS...',
  };
}
```

### Core Web Vitals Targets
- **LCP** < 2.5s
- **FID** < 100ms
- **CLS** < 0.1

## Pages Structure

```
/                     # Landing page (público)
/login                # Login/Signup
/dashboard            # Dashboard do usuário
/resumes              # Lista de currículos
/resumes/new          # Criar novo currículo
/resumes/[id]         # Editar currículo
/resumes/[id]/analyze # Analisar currículo
/jobs                 # Lista de vagas salvas
/billing              # Gerenciar assinatura
/settings             # Configurações da conta
/s/[shareId]          # Currículo público (SSR)
```

## Error Handling

### Frontend
```typescript
// Global error boundary
export function ErrorBoundary({ error, reset }) {
  return (
    <div>
      <h2>Algo deu errado</h2>
      <button onClick={reset}>Tentar novamente</button>
    </div>
  );
}

// API error handling
const { data, error, isLoading } = useQuery({
  queryKey: ['resumes'],
  queryFn: fetchResumes,
  retry: 3,
});
```

### Backend
```typescript
// Standardized error responses
interface ApiError {
  error: string;
  message: string;
  code?: string;
  details?: object;
}

// Example: 403 Premium Required
{
  error: "premium_required",
  message: "Assine o Resuna Premium para usar esta funcionalidade",
  code: "PREMIUM_REQUIRED"
}
```

## Testing Strategy

### Frontend (Vitest + Testing Library)
```typescript
// Component tests
describe('ResumeBuilder', () => {
  it('should auto-save after changes', async () => {
    // ...
  });
  
  it('should show validation errors', async () => {
    // ...
  });
});

// E2E tests (Playwright)
test('complete resume creation flow', async ({ page }) => {
  await page.goto('/resumes/new');
  // ...
});
```

### Backend (Jest)
```typescript
// API tests
describe('POST /api/resumes', () => {
  it('should create resume for authenticated user', async () => {
    // ...
  });
  
  it('should reject unauthenticated requests', async () => {
    // ...
  });
});
```

## Deployment

### Frontend (Vercel)
```bash
# vercel.json
{
  "framework": "nextjs",
  "regions": ["gru1"],  # São Paulo
  "env": {
    "NEXT_PUBLIC_API_URL": "@api_url",
    "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN": "@paddle_client_token"
  }
}
```

### Backend (Cloud Run)
```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/resuna-api', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/resuna-api']
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    args:
      - 'run'
      - 'deploy'
      - 'resuna-api'
      - '--image=gcr.io/$PROJECT_ID/resuna-api'
      - '--region=southamerica-east1'
      - '--allow-unauthenticated'
```

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://api.resuna.app
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=live_...
```

### Backend (application.yml)
```yaml
# src/main/resources/application.yml
server:
  port: 8080

spring:
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}

# Firebase
firebase:
  project-id: ${FIREBASE_PROJECT_ID}
  credentials-path: ${GOOGLE_APPLICATION_CREDENTIALS}

# Paddle
paddle:
  api-key: ${PADDLE_API_KEY}
  webhook-secret: ${PADDLE_WEBHOOK_SECRET}

# Gemini
gemini:
  api-key: ${GEMINI_API_KEY}

# ATS Engine (Python microservice)
ats-engine:
  url: ${ATS_ENGINE_URL}
```

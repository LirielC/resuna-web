# ATS Engine - Deployment Guide

## Visão Geral

O **ATS Engine** é um microserviço Python (FastAPI) que realiza análise NLP avançada de currículos usando:

- **spaCy** - NER, POS tagging, similaridade semântica
- **scikit-learn** - TF-IDF para extração de keywords
- **numpy** - Cálculos numéricos

## Arquitetura

```
┌─────────────────────┐
│ Backend Spring Boot │
│   (Port 8080)       │
└──────────┬──────────┘
           │ HTTP POST
           ▼
┌─────────────────────┐
│  ATS Engine Python  │
│   FastAPI (8000)    │
│                     │
│  • spaCy NLP        │
│  • TF-IDF           │
│  • Semantic Match   │
└─────────────────────┘
```

## Opções de Deployment

### Opção 1: Docker (Recomendado)

#### Pré-requisitos
- Docker instalado
- Docker Compose (opcional)

#### Build e Run

```bash
cd backend/ats-engine

# Build da imagem
docker build -t resuna-ats-engine .

# Run do container
docker run -d \
  --name ats-engine \
  -p 8000:8000 \
  --restart unless-stopped \
  resuna-ats-engine

# Verificar logs
docker logs -f ats-engine

# Verificar health
curl http://localhost:8000/health
```

#### Docker Compose

```bash
# Iniciar
docker-compose up -d

# Parar
docker-compose down

# Ver logs
docker-compose logs -f
```

---

### Opção 2: Local (Desenvolvimento)

#### Pré-requisitos
- Python 3.8+
- pip
- virtualenv

#### Setup

```bash
cd backend/ats-engine

# Executar script de setup
chmod +x setup.sh
./setup.sh

# Ou manualmente:
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

pip install -r requirements.txt
python -m spacy download en_core_web_md
```

#### Run

```bash
# Ativar ambiente
source venv/bin/activate

# Iniciar servidor
python main.py

# Ou com uvicorn
uvicorn main:app --reload --port 8000
```

---

### Opção 3: Google Cloud Run (Produção)

#### Pré-requisitos
- Google Cloud SDK instalado
- Projeto GCP configurado
- Billing habilitado

#### Deploy

```bash
# 1. Autenticar
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. Build e push para GCR
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/resuna-ats-engine

# 3. Deploy no Cloud Run
gcloud run deploy resuna-ats-engine \
  --image gcr.io/YOUR_PROJECT_ID/resuna-ats-engine \
  --platform managed \
  --region southamerica-east1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 60s \
  --max-instances 10 \
  --min-instances 0

# 4. Obter URL
gcloud run services describe resuna-ats-engine \
  --platform managed \
  --region southamerica-east1 \
  --format 'value(status.url)'
```

#### Configurar Backend Java

Atualizar `application.yml`:

```yaml
ats:
  engine:
    url: https://resuna-ats-engine-xxxxx.run.app
```

---

### Opção 4: AWS Lambda (Serverless)

#### Usando Mangum adapter

```bash
# Adicionar ao requirements.txt
mangum==0.17.0

# Criar handler
# lambda_handler.py
from mangum import Mangum
from main import app

handler = Mangum(app)
```

#### Deploy com AWS SAM

```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  ATSEngineFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: ats-engine/
      Handler: lambda_handler.handler
      Runtime: python3.11
      MemorySize: 1024
      Timeout: 60
      Events:
        Api:
          Type: Api
          Properties:
            Path: /{proxy+}
            Method: ANY
```

---

## Configuração

### Variáveis de Ambiente

```bash
# Opcional
export LOG_LEVEL=INFO
export PYTHONUNBUFFERED=1
export WORKERS=4  # Para produção com gunicorn
```

### application.yml (Backend Java)

```yaml
ats:
  engine:
    url: http://localhost:8000  # Desenvolvimento
    # url: https://ats-engine.run.app  # Produção
```

---

## Monitoramento

### Health Check

```bash
curl http://localhost:8000/health

# Response
{
  "status": "healthy"
}
```

### Métricas

```bash
# Logs do container
docker logs ats-engine

# Logs do Cloud Run
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=resuna-ats-engine" --limit 50
```

### Performance

- **Cold start**: ~5-10s (primeira requisição após inatividade)
- **Warm requests**: ~200-500ms
- **Memória**: ~400-600MB (com spaCy model)
- **CPU**: Baixo uso (<10% idle, ~50% durante análise)

---

## Troubleshooting

### Erro: spaCy model not found

```bash
# Download manual do modelo
python -m spacy download en_core_web_md

# Ou no Dockerfile
RUN python -m spacy download en_core_web_md
```

### Erro: Memory limit exceeded

```bash
# Aumentar memória no Cloud Run
gcloud run services update resuna-ats-engine \
  --memory 2Gi

# Ou no Docker
docker run -m 2g resuna-ats-engine
```

### Erro: Connection refused (Backend -> Python)

1. Verificar se ATS Engine está rodando:
   ```bash
   curl http://localhost:8000/health
   ```

2. Verificar URL no `application.yml`

3. Verificar firewall/network (Cloud Run precisa ser público ou usar VPC)

### Erro: Analysis timeout

```bash
# Aumentar timeout no Cloud Run
gcloud run services update resuna-ats-engine --timeout 120s

# Ou no backend Java (application.yml)
spring:
  cloud:
    gateway:
      httpclient:
        connect-timeout: 30000
        response-timeout: 60s
```

---

## Custos (Google Cloud Run)

### Estimativa Mensal

**Cenário: 1000 análises/mês**

- Requests: 1000 × $0.40/million = $0.0004
- CPU time: 1000 × 0.5s × $0.00002400/vCPU-second = $0.012
- Memory: 1000 × 0.5s × 1GB × $0.00000250/GB-second = $0.00125
- **Total: ~$0.01/mês** (praticamente grátis)

**Free tier**: 2 milhões de requests/mês

---

## Segurança

### Produção

1. **Autenticação**: Adicionar API key ou JWT

```python
from fastapi import Header, HTTPException

async def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401)
    # Verificar token
```

2. **Rate Limiting**: Limitar requests por IP

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/api/analyze")
@limiter.limit("10/minute")
async def analyze_resume(request: AnalysisRequest):
    ...
```

3. **CORS**: Restringir origins

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://resuna.app"],  # Apenas domínio de produção
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["*"],
)
```

---

## Próximos Passos

### Melhorias Planejadas

1. **Cache de análises** - Redis para resultados frequentes
2. **Batch processing** - Analisar múltiplos currículos de uma vez
3. **Webhooks** - Notificar backend quando análise completa
4. **Métricas** - Prometheus + Grafana
5. **A/B testing** - Testar diferentes modelos spaCy

### Modelos spaCy Alternativos

- `en_core_web_sm` - Menor, mais rápido, menos preciso (13MB)
- `en_core_web_md` - **Atual** - Balanceado (40MB)
- `en_core_web_lg` - Maior, mais preciso, mais lento (560MB)
- `en_core_web_trf` - Transformer-based, melhor qualidade (438MB)

---

## Suporte

Para problemas ou dúvidas:

1. Verificar logs: `docker logs ats-engine`
2. Testar health: `curl http://localhost:8000/health`
3. Testar análise: `python test_analysis.py`
4. Consultar documentação: http://localhost:8000/docs

---

## Referências

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [spaCy Documentation](https://spacy.io/)
- [Google Cloud Run](https://cloud.google.com/run/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

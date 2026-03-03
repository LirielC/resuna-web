# Resuna ATS Engine

FastAPI microservice for ATS (Applicant Tracking System) resume analysis using **advanced NLP**.

## 🚀 Features

### Advanced NLP Analysis

- **spaCy NER** - Named Entity Recognition para extrair skills e organizações
- **TF-IDF** - Extração de keywords por importância estatística
- **Semantic Similarity** - Análise de similaridade semântica usando word vectors
- **POS Tagging** - Part-of-Speech tagging para identificar termos técnicos
- **Pattern Matching** - Detecção de multi-word expressions (e.g., "machine learning")

### Scoring System

- **Keyword Match** (35%) - Quantos keywords da vaga estão no currículo
- **Skills Match** (35%) - Match ponderado por importância (critical/important/nice-to-have)
- **Experience** (20%) - Anos de experiência, títulos relevantes, achievements quantificados
- **Education** (10%) - Nível de educação vs requisitos da vaga

### Smart Gap Analysis

- Identifica skills **críticos** (required, must have)
- Identifica skills **importantes** (preferred, should have)
- Identifica skills **desejáveis** (nice to have, plus)
- Gera sugestões personalizadas para cada gap

## Installation

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
# or
uvicorn main:app --reload --port 8000
```

### Docker

```bash
# Build image
docker build -t resuna-ats-engine .

# Run container
docker run -p 8000:8000 resuna-ats-engine
```

## API Endpoints

### Health Check

```bash
GET /
GET /health
```

### Analyze Resume

```bash
POST /api/analyze
Content-Type: application/json

{
  "resume": {
    "id": "uuid",
    "title": "Software Engineer Resume",
    "skills": ["Java", "Python", "React"],
    "experience": [...],
    "education": [...]
  },
  "job_description": "We are looking for a Software Engineer with Java and Spring Boot...",
  "job_title": "Senior Software Engineer"
}
```

**Response:**

```json
{
  "score": 85,
  "scoreBreakdown": {
    "keywordMatch": 80,
    "skillsMatch": 85,
    "experienceMatch": 90,
    "educationMatch": 85
  },
  "matches": [
    {
      "keyword": "java",
      "category": "skill",
      "frequency": 1
    }
  ],
  "gaps": [
    {
      "keyword": "kubernetes",
      "category": "skill",
      "importance": "important",
      "suggestion": "Consider adding 'kubernetes' to your skills or experience"
    }
  ],
  "recommendations": [
    "Your resume is an excellent match for this position!",
    "Quantify your achievements with numbers and metrics",
    "Use action verbs to start each bullet point"
  ]
}
```

## Testing

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test analysis endpoint
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d @test_payload.json
```

## Deployment

### Google Cloud Run

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/resuna-ats-engine

# Deploy to Cloud Run
gcloud run deploy resuna-ats-engine \
  --image gcr.io/PROJECT_ID/resuna-ats-engine \
  --platform managed \
  --region southamerica-east1 \
  --allow-unauthenticated
```

## 🎯 Analysis Pipeline

```
1. Text Preprocessing
   ↓
2. spaCy NLP Processing
   • Tokenization
   • POS Tagging
   • Named Entity Recognition
   ↓
3. Keyword Extraction
   • Technical skills patterns
   • TF-IDF scoring
   • Multi-word expressions
   ↓
4. Matching & Scoring
   • Exact matches
   • Partial matches
   • Importance weighting
   ↓
5. Semantic Analysis
   • Document similarity
   • Context analysis
   ↓
6. Score Calculation
   • Weighted scoring
   • Gap penalties
   • Semantic bonus
   ↓
7. Recommendations
   • Critical gaps
   • Improvement suggestions
   • Best practices
```

## 📊 Example Analysis

**Input:**
- Resume: Java, Spring Boot, React, Docker, AWS
- Job: Java, Spring Boot, React, Kubernetes, AWS, Python, CI/CD

**Output:**
```json
{
  "score": 68,
  "scoreBreakdown": {
    "keywordMatch": 71,
    "skillsMatch": 61,
    "experienceMatch": 85,
    "educationMatch": 100
  },
  "matches": [
    {"keyword": "java", "frequency": 3},
    {"keyword": "spring boot", "frequency": 2},
    {"keyword": "react", "frequency": 1}
  ],
  "gaps": [
    {
      "keyword": "kubernetes",
      "importance": "critical",
      "suggestion": "CRITICAL: Add 'kubernetes' - this is a required skill"
    },
    {
      "keyword": "python",
      "importance": "important",
      "suggestion": "Consider highlighting 'python' experience if you have it"
    }
  ]
}
```

## 🔧 Technical Stack

- **FastAPI** - Modern async web framework
- **spaCy 3.7** - Industrial-strength NLP
  - Model: `en_core_web_md` (40MB, word vectors included)
- **scikit-learn** - TF-IDF vectorization
- **numpy** - Numerical computations
- **pydantic** - Data validation

## 🚀 Quick Start

### Docker (Recommended)

```bash
docker build -t resuna-ats-engine .
docker run -p 8000:8000 resuna-ats-engine
```

### Local Development

```bash
./setup.sh  # Instala dependências e spaCy model
./start.sh  # Inicia o servidor
```

## 📚 Documentation

- **API Docs**: http://localhost:8000/docs (Swagger UI)
- **Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Integration Guide**: [../ATS_INTEGRATION_GUIDE.md](../ATS_INTEGRATION_GUIDE.md)

## 🧪 Testing

```bash
# Test analysis logic
python test_analysis.py

# Test API endpoint
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d @test_payload.json
```

## 📈 Performance

- **Cold start**: 5-10s (primeira requisição)
- **Warm requests**: 200-500ms
- **Memory**: ~500MB (com spaCy model)
- **Throughput**: ~10-20 req/s (single instance)

## 🔐 Production Considerations

1. **Authentication** - Adicionar API key ou JWT
2. **Rate Limiting** - Limitar requests por IP
3. **Caching** - Redis para análises frequentes
4. **Monitoring** - Prometheus + Grafana
5. **Scaling** - Múltiplas instâncias com load balancer

## 🌍 Deployment Options

- ✅ **Docker** - Containerização
- ✅ **Google Cloud Run** - Serverless (recomendado)
- ✅ **AWS Lambda** - Serverless (com Mangum)
- ✅ **Kubernetes** - Orquestração
- ✅ **VM/VPS** - Tradicional

Ver [DEPLOYMENT.md](DEPLOYMENT.md) para detalhes.

## 🔮 Future Enhancements

- [ ] Support for multiple languages (PT-BR, ES, FR)
- [ ] Transformer-based models (BERT, RoBERTa)
- [ ] Resume parsing from PDF/DOCX
- [ ] Batch analysis endpoint
- [ ] Webhook notifications
- [ ] A/B testing framework
- [ ] Custom skill taxonomies
- [ ] Industry-specific scoring
